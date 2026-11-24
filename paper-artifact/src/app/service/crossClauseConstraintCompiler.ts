import type {ConstraintTaskPlan} from './constraintTaskPlan';
import {assertConstraintTaskPlan} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {ContractClause} from './modelRuleDiagnostics';
import {assertGraph, buildStaticCrossClauseGraph, ccHash, type CrossClauseGraph, type Provenance} from './crossClauseGraph';

export const CC_PACKAGE_VERSION = 'cross-clause-constraint-package-v1';
export type ConstraintKind = 'binding-scope' | 'model-type' | 'temporal-scope' | 'result-scope' | 'task-support' | 'business-alignment';
export type CompiledConstraint = {
  id: string;
  kind: ConstraintKind;
  clauses: ContractClause[];
  condition: string;
  checker: string;
  enforcement: 'hard' | 'advisory';
  evidenceLevel: 'grounded' | 'unresolved';
  provenance: Provenance;
};
export type CrossClauseConstraintPackage = {
  version: typeof CC_PACKAGE_VERSION;
  planHash: string;
  modelRulesHash: string;
  modelIndexHash: string;
  staticGraphHash: string;
  signature: {name: string; parameters: {name: string; type: string}[]; result: string | null};
  declarations: ConstraintTaskPlan['declarations'];
  tasks: {id: string; clause: string; requirement: string; requirementLine: number}[];
  constraints: CompiledConstraint[];
  hash: string;
};
export function compileCrossClauseConstraints(plan: ConstraintTaskPlan, context: OperationModelGrounding,
  graph: CrossClauseGraph = buildStaticCrossClauseGraph(plan, context)): CrossClauseConstraintPackage {
  assertConstraintTaskPlan(plan, context);
  assertGraph(graph);
  if (graph.candidateHash || graph.hash !== buildStaticCrossClauseGraph(plan, context).hash)
    throw new Error('K must be compiled exclusively from the authoritative static graph');
  const source: Provenance = {taskIds: plan.tasks.map(task => task.id), sourceLines: plan.tasks.map(task => task.requirementLine),
    modelDeclarationIds: plan.declarations.map(item => item.id), locations: [],
    basis: 'immutable task/model facts and existing scope/subset rules; no candidate, reference contract or Oracle'};
  const spec: Omit<CompiledConstraint, 'id' | 'provenance'>[] = [
    {kind: 'binding-scope', clauses: ['definition', 'precondition', 'postcondition'], enforcement: 'hard', evidenceLevel: 'grounded',
      checker: 'CC-SCOPE', condition: 'Use one declaration per name in a lexical scope. A D binding may supply P/Q; every use resolves in its actual scope. Do not leak iterator/let locals across clauses. Shared helpers are optional, not mandatory.'},
    {kind: 'model-type', clauses: ['definition', 'precondition', 'postcondition'], enforcement: 'hard', evidenceLevel: 'grounded',
      checker: 'CC-TYPE', condition: 'Bind and navigate only declared model elements with compatible supported types. Shared bindings, parameter uses and result assignments must respect the attached declarations. Deferred inference is unresolved.'},
    {kind: 'temporal-scope', clauses: ['definition', 'precondition', 'postcondition'], enforcement: 'hard', evidenceLevel: 'grounded',
      checker: 'CC-TEMPORAL', condition: 'Use @pre only in Q under the executable subset; an unmarked Q property is a current-state access. Do not infer that every post-state access is an effect.'},
    {kind: 'result-scope', clauses: ['definition', 'precondition', 'postcondition'], enforcement: 'hard', evidenceLevel: 'grounded',
      checker: 'CC-RESULT-SCOPE', condition: 'Use result only in Q of a value-returning operation, with the attached return type. The value must be solved from the requirement, not invented from its type.'},
    {kind: 'task-support', clauses: ['precondition', 'postcondition'], enforcement: 'hard', evidenceLevel: 'grounded',
      checker: 'existing-task-evidence-audit', condition: 'Return actual candidate AST evidence for each issued task in its assigned clause. Structural task linkage is checked independently of business truth.'},
    {kind: 'business-alignment', clauses: ['definition', 'precondition', 'postcondition'], enforcement: 'advisory', evidenceLevel: 'unresolved',
      checker: 'independent-behavioral-evidence', condition: 'Solve the original task meaning. Lexical hints or common binding names do not prove same business target, query equivalence, completeness or identifier uniqueness.'},
  ];
  const payload: Omit<CrossClauseConstraintPackage, 'hash'> = {version: CC_PACKAGE_VERSION, planHash: plan.hash, modelRulesHash: context.rules.rulesHash,
    modelIndexHash: ccHash(context.index), staticGraphHash: graph.hash,
    signature: {name: context.index.operation.name, parameters: context.index.operation.parameters.map(item => ({name: item.name, type: item.type.raw})),
      result: context.index.operation.returnType?.type.raw ?? null},
    declarations: structuredClone(plan.declarations),
    tasks: plan.tasks.map(({id, clause, requirement, requirementLine}) => ({id, clause, requirement, requirementLine})),
    constraints: spec.map((item, index) => ({...item, id: `${plan.operationId}/cc/${index + 1}`, provenance: structuredClone(source)}))};
  return {...payload, hash: ccHash(payload)};
}
export function assertCrossClausePackage(pack: CrossClauseConstraintPackage, plan: ConstraintTaskPlan, context: OperationModelGrounding) {
  if (ccHash(pack) !== ccHash(compileCrossClauseConstraints(plan, context))) throw new Error('Immutable cross-clause package changed');
}
export const renderCrossClausePackage = (pack: CrossClauseConstraintPackage) =>
  `Program-compiled cross-clause constraint package K (${pack.version}). Jointly choose D/P/Q; satisfy every hard constraint and provide AST-checkable task evidence. Advisory constraints remain unresolved until independently established.\n${JSON.stringify(pack)}`;
