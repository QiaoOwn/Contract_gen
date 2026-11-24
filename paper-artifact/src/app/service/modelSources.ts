import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import type {ModelOrigin, ModelSource} from './modelIndex';

type Declaration = {
  kind: string;
  name: string;
  owner?: string;
  services: string[];
  source: ModelSource;
};

const property = (node: ts.NewExpression, key: string) => {
  const argument = node.arguments?.[0];
  if (!argument || !ts.isObjectLiteralExpression(argument)) return undefined;
  return argument.properties.find(
    (item): item is ts.PropertyAssignment =>
      ts.isPropertyAssignment(item) && item.name.getText() === key
  )?.initializer;
};
const literal = (value?: ts.Node) =>
  value && ts.isStringLiteralLike(value) ? value.text : undefined;

// Parse declarations, not their OCL bodies; retain locations without exporting source text.
export const readModelSources = (root: string, project: string) => {
  const directory = path.join(root, 'src/rm2pt/project', project);
  const files = (folder: string): string[] =>
    fs
      .readdirSync(folder, {withFileTypes: true})
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((entry) =>
        entry.isDirectory()
          ? files(path.join(folder, entry.name))
          : entry.name.endsWith('.ts')
            ? [path.join(folder, entry.name)]
            : []
      );
  const declarations: Declaration[] = [];
  const sourceFiles: {file: string; sha256: string}[] = [];
  const useCaseFiles = new Map<string, string>();
  for (const file of files(directory)) {
    const text = fs.readFileSync(file, 'utf8');
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const sourceFile = path.relative(root, file).replaceAll('\\', '/');
    const sha256 = createHash('sha256').update(text).digest('hex');
    sourceFiles.push({file: sourceFile, sha256});
    const services: string[] = [];
    const local: Declaration[] = [];
    const imports = new Map<string, string>();
    for (const statement of tree.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        statement.importClause?.name &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        imports.set(
          statement.importClause.name.text,
          path
            .relative(
              root,
              path.resolve(path.dirname(file), statement.moduleSpecifier.text + '.ts')
            )
            .replaceAll('\\', '/')
        );
      }
    }
    const visit = (node: ts.Node, parents: ts.NewExpression[]) => {
      if (
        ts.isVariableDeclaration(node) &&
        node.name.getText() === 'useCase' &&
        node.initializer &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        for (const entry of node.initializer.properties) {
          if (ts.isShorthandPropertyAssignment(entry)) {
            const target = imports.get(entry.name.text);
            if (target) useCaseFiles.set(entry.name.text, target);
          } else if (ts.isPropertyAssignment(entry) && ts.isIdentifier(entry.initializer)) {
            const target = imports.get(entry.initializer.text);
            if (target) useCaseFiles.set(entry.name.getText(), target);
          }
        }
      }
      const next = ts.isNewExpression(node) ? [...parents, node] : parents;
      if (ts.isNewExpression(node)) {
        const kind = node.expression.getText();
        const name = kind === 'ReturnedType' ? 'result' : literal(property(node, 'name'));
        if (kind === 'Service' && name) services.push(name);
        const parentKind = kind === 'Parameter' || kind === 'ReturnedType' ? 'Operation' : 'Entity';
        const owner = [...parents]
          .reverse()
          .find((parent) => parent.expression.getText() === parentKind);
        if (name) {
          const start = tree.getLineAndCharacterOfPosition(node.getStart(tree));
          const end = tree.getLineAndCharacterOfPosition(node.getEnd());
          local.push({
            kind,
            name,
            owner: owner ? literal(property(owner, 'name')) : undefined,
            services,
            source: {
              file: sourceFile,
              line: start.line + 1,
              column: start.character + 1,
              endLine: end.line + 1,
              sha256,
            },
          });
        }
      }
      ts.forEachChild(node, (child) => visit(child, next));
    };
    visit(tree, []);
    declarations.push(...local);
  }
  const kinds = {
    entity: 'Entity',
    attribute: 'Attribute',
    association: 'Relationship',
    state: 'TempVariable',
    operation: 'Operation',
    parameter: 'Parameter',
    return: 'ReturnedType',
  };
  return {
    declarations,
    sourceFiles,
    resolve(origin: ModelOrigin): ModelSource | null {
      let candidates = declarations.filter(
        (item) => item.kind === kinds[origin.kind] && item.name === origin.name
      );
      if (['attribute', 'association', 'parameter', 'return'].includes(origin.kind)) {
        candidates = candidates.filter((item) => item.owner === origin.owner);
      }
      if (['operation', 'parameter', 'return', 'state'].includes(origin.kind)) {
        const expectedFile =
          origin.kind === 'state' && origin.systemState
            ? `src/rm2pt/project/${project}/systemService.ts`
            : useCaseFiles.get(origin.useCase);
        const preferred = candidates.filter((item) => item.source.file === expectedFile);
        if (preferred.length) candidates = preferred;
        else if (origin.kind === 'state')
          candidates = candidates.filter((item) => item.services.includes(origin.service!));
      }
      return candidates.length === 1 ? candidates[0].source : null;
    },
  };
};
