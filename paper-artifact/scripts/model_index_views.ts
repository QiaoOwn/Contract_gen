import * as t from '@babel/types';
import type {IndexedType, ModelIndex} from '../src/app/service/modelIndex';

export type ViewDeclarations = Map<string, string>;

// This parser deliberately follows the existing serializer's labeled, indented format.
// Duplicate declarations are rejected instead of being overwritten in the comparison map.
export const readPromptDeclarations = (text: string): ViewDeclarations => {
  const result = new Map<string, string>();
  const put = (key: string, value: string) => {
    if (result.has(key)) throw new Error(`Duplicate prompt declaration: ${key}`);
    result.set(key, value);
  };
  let inEntities = false;
  let entity = '';
  let section = '';
  let feature = '';
  for (const line of text.split(/\r?\n/)) {
    if (line === '  Entities') {
      inEntities = true;
      continue;
    }
    if (!inEntities) {
      const state = /^      \d+\.([A-Za-z_]\w*): (.+)$/.exec(line);
      if (state) put(`state/${state[1]}`, state[2]);
      const environment = /^  \d+\.(Today|Now): (.+)$/.exec(line);
      if (environment) put(`environment/${environment[1]}`, environment[2]);
      continue;
    }
    const name = /^    Name: (.+)$/.exec(line);
    if (name) {
      entity = name[1];
      put(`entity/${entity}`, 'entity');
      continue;
    }
    const base = /^      Extends: (.+)$/.exec(line);
    if (base) put(`entity/${entity}/base`, base[1]);
    if (line === '      Attributes') section = 'attribute';
    if (line === '      Relationships') section = 'association';
    const member = /^        \d+\.Name: (.+)$/.exec(line);
    if (member) feature = member[1];
    const type = /^          Type: (.+)$/.exec(line);
    if (type) put(`entity/${entity}/${section}/${feature}`, type[1]);
    const association = /^          Association Type: (.+)$/.exec(line);
    if (association) put(`entity/${entity}/association-kind/${feature}`, association[1]);
  }
  return result;
};

export const expectedPromptDeclarations = (index: ModelIndex): ViewDeclarations => {
  const result = new Map<string, string>();
  for (const entity of index.entities) {
    result.set(`entity/${entity.name}`, 'entity');
    if (entity.base) result.set(`entity/${entity.name}/base`, entity.base);
    for (const feature of entity.features) {
      result.set(`entity/${entity.name}/${feature.kind}/${feature.name}`, feature.type.raw);
      if (feature.kind === 'association')
        result.set(
          `entity/${entity.name}/association-kind/${feature.name}`,
          feature.associationType!
        );
    }
  }
  for (const variable of index.operation.serviceState)
    result.set(`state/${variable.name}`, variable.type.raw);
  for (const value of index.environment) result.set(`environment/${value.name}`, value.type);
  return result;
};

export const typescriptTypeName = (type: t.TSType): string => {
  if (t.isTSNumberKeyword(type)) return 'number';
  if (t.isTSStringKeyword(type)) return 'string';
  if (t.isTSBooleanKeyword(type)) return 'boolean';
  if (t.isTSVoidKeyword(type)) return 'void';
  if (t.isTSArrayType(type)) return `Array<${typescriptTypeName(type.elementType)}>`;
  if (t.isTSTypeReference(type)) {
    const name = (node: t.TSEntityName): string =>
      t.isIdentifier(node) ? node.name.trim() : `${name(node.left)}.${node.right.name.trim()}`;
    return name(type.typeName);
  }
  throw new Error(`Unsupported generated TypeScript annotation ${type.type}`);
};

export const expectedTypescriptType = (type: IndexedType): string => {
  if (type.kind === 'set') return `Array<${expectedTypescriptType(type.element!)}>`;
  const primitives: Record<string, string> = {
    Integer: 'number',
    Real: 'number',
    Boolean: 'boolean',
    String: 'string',
    Date: 'dayjs.Dayjs',
    LocalDate: 'dayjs.Dayjs',
    void: 'void',
  };
  return primitives[type.name!] ?? type.name ?? `unsupported:${type.raw}`;
};

export const readTypedDeclarations = (file: t.File, service = false): ViewDeclarations => {
  const result = new Map<string, string>();
  const put = (key: string, value: string) => {
    if (result.has(key)) throw new Error(`Duplicate typed declaration: ${key}`);
    result.set(key, value);
  };
  for (const node of file.program.body) {
    if (t.isTSEnumDeclaration(node)) {
      put(
        `enum/${node.id.name}`,
        JSON.stringify(
          node.members
            .map((member) => (t.isIdentifier(member.id) ? member.id.name : member.id.value))
            .sort()
        )
      );
    }
    if (!t.isClassDeclaration(node)) continue;
    const prefix = service ? 'service' : `entity/${node.id!.name}`;
    put(prefix, 'class');
    if (node.superClass && t.isIdentifier(node.superClass))
      put(`${prefix}/base`, node.superClass.name);
    for (const member of node.body.body) {
      if (t.isClassProperty(member) && t.isIdentifier(member.key)) {
        const annotation = member.typeAnnotation;
        if (!t.isTSTypeAnnotation(annotation))
          throw new Error(`Missing type: ${prefix}.${member.key.name}`);
        put(`${prefix}/field/${member.key.name}`, typescriptTypeName(annotation.typeAnnotation));
      }
      if (t.isClassMethod(member) && t.isIdentifier(member.key)) {
        put(
          `operation/${member.key.name}/parameter-order`,
          JSON.stringify(
            member.params.map((parameter) =>
              t.isIdentifier(parameter) ? parameter.name : '<unsupported>'
            )
          )
        );
        for (const parameter of member.params) {
          if (!t.isIdentifier(parameter) || !t.isTSTypeAnnotation(parameter.typeAnnotation))
            throw new Error('Unsupported parameter');
          put(
            `operation/${member.key.name}/parameter/${parameter.name}`,
            typescriptTypeName(parameter.typeAnnotation.typeAnnotation)
          );
        }
        if (!t.isTSTypeAnnotation(member.returnType)) throw new Error('Missing return annotation');
        put(
          `operation/${member.key.name}/return`,
          typescriptTypeName(member.returnType.typeAnnotation)
        );
      }
    }
  }
  return result;
};

export const expectedTypedDeclarations = (index: ModelIndex): ViewDeclarations => {
  const result = new Map<string, string>();
  for (const entity of index.entities) {
    const prefix = `entity/${entity.name}`;
    result.set(prefix, 'class');
    if (entity.base) result.set(`${prefix}/base`, entity.base);
    for (const feature of entity.features)
      result.set(`${prefix}/field/${feature.name}`, expectedTypescriptType(feature.type));
  }
  for (const enumeration of index.enumerations) {
    // Conflicting declarations are separately reported; never manufacture their union.
    const first = enumeration.declarations[0];
    result.set(`enum/${enumeration.name}`, JSON.stringify([...first.literals].sort()));
  }
  result.set('service', 'class');
  for (const state of index.operation.serviceState)
    result.set(`service/field/${state.name}`, expectedTypescriptType(state.type));
  for (const parameter of index.operation.parameters)
    result.set(
      `operation/${index.operation.name}/parameter/${parameter.name}`,
      expectedTypescriptType(parameter.type)
    );
  result.set(
    `operation/${index.operation.name}/parameter-order`,
    JSON.stringify(index.operation.parameters.map((parameter) => parameter.name))
  );
  result.set(
    `operation/${index.operation.name}/return`,
    index.operation.returnType ? expectedTypescriptType(index.operation.returnType.type) : 'void'
  );
  return result;
};

export const compareDeclarations = (expected: ViewDeclarations, actual: ViewDeclarations) =>
  [...new Set([...expected.keys(), ...actual.keys()])].sort().flatMap((key) => {
    const wanted = expected.get(key);
    const found = actual.get(key);
    return wanted === found ? [] : [{key, expected: wanted ?? null, actual: found ?? null}];
  });
