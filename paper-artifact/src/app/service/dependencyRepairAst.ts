import {ParserRuleContext} from 'antlr4';
import {generateContractCode, parse} from '../util';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import {ccHash} from './crossClauseGraph';

export const REPAIR_CLAUSES: ContractClause[] = ['definition', 'precondition', 'postcondition'];
export type PermissionAst = {
  kind: string;
  text: string;
  path: number[];
  clause: ContractClause;
  location?: OclLocation;
  children: PermissionAst[];
};
export function permissionAst(candidate: RepairCandidate, context: OperationModelGrounding) {
  const op = context.index.operation;
  const contract = generateContractCode({
    serviceName: op.service,
    operationName: op.name,
    parameters: op.parameters.map((item) => ({name: item.name, type: item.type.raw})),
    returnedType: op.returnType?.type.raw,
    ...candidate,
  });
  const parsed = parse(contract);
  const roots: Partial<Record<ContractClause, PermissionAst>> = {};
  const nodes: PermissionAst[] = [];
  const build = (
    node: ParserRuleContext,
    clause: ContractClause,
    path: number[]
  ): PermissionAst => {
    const location: OclLocation = {
      clause,
      line: node.start.line,
      column: node.start.column + 1,
      endLine: node.stop?.line ?? node.start.line,
      endColumn: (node.stop?.column ?? node.start.column) + (node.stop?.text?.length ?? 1) + 1,
      startOffset: node.start.start,
      endOffset: (node.stop?.stop ?? node.start.stop) + 1,
      expression: node.getText(),
    };
    const result: PermissionAst = {
      kind: node.constructor.name,
      text: node.getText(),
      path,
      clause,
      location,
      children: (node.children ?? []).map((child, i) =>
        child instanceof ParserRuleContext
          ? build(child, clause, [...path, i])
          : {kind: 'token', text: child.getText(), path: [...path, i], clause, children: []}
      ),
    };
    nodes.push(result);
    return result;
  };
  if (parsed.tree && !parsed.errors.length) {
    const d = parsed.tree.ruleDefinition();
    if (d) roots.definition = build(d, 'definition', []);
    roots.precondition = build(parsed.tree.rulePrecondition(), 'precondition', []);
    roots.postcondition = build(parsed.tree.rulePostcondition(), 'postcondition', []);
  }
  return {
    contract,
    errors: parsed.errors,
    roots,
    nodes,
    parsed: Boolean(parsed.tree && !parsed.errors.length),
  };
}
export const samePath = (a: number[], b: number[]) =>
  a.length === b.length && a.every((n, i) => n === b[i]);
export const pathContains = (outer: number[], inner: number[]) =>
  outer.length <= inner.length && outer.every((n, i) => n === inner[i]);
export const astStructure = (node?: PermissionAst): unknown =>
  node
    ? [
        node.kind,
        ...(node.children.length ? node.children.map((child) => astStructure(child)) : [node.text]),
      ]
    : null;
export const astStructureHash = (node?: PermissionAst) => ccHash(astStructure(node));
export function smallestSite(
  ast: ReturnType<typeof permissionAst>,
  site: OclLocation,
  prefer: string[] = []
) {
  const hits = ast.nodes.filter(
    (node) =>
      node.location &&
      node.clause === site.clause &&
      node.location.startOffset <= site.startOffset &&
      node.location.endOffset >= site.endOffset &&
      (!prefer.length || prefer.includes(node.kind))
  );
  return hits.sort(
    (a, b) =>
      a.location!.endOffset -
        a.location!.startOffset -
        (b.location!.endOffset - b.location!.startOffset) || b.path.length - a.path.length
  )[0];
}
