import {
  compileCrossClauseConstraints,
  assertCrossClausePackage,
  type CrossClauseConstraintPackage,
} from './crossClauseConstraintCompiler';
import type {ConstraintTaskPlan} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import {ccHash} from './crossClauseGraph';

export type RelationConstraint25 = {
  id: string;
  kind: 'definition-consumer' | 'shared-binding-identity' | 'temporal-consumer';
  clauses: string[];
  taskIds: string[];
  sourceLines: number[];
  modelDeclarationIds: string[];
  condition: string;
  strength: 'grounded-conditional';
  enforcement: 'hard-in-supported-structural-domain';
};
export function compilePackage25(plan: ConstraintTaskPlan, context: OperationModelGrounding) {
  const base = compileCrossClauseConstraints(plan, context);
  const constraints: RelationConstraint25[] = (['precondition', 'postcondition'] as const).map(
    (clause) => {
      const tasks = plan.tasks.filter((task) => task.clause === clause);
      return {
        id: `${plan.operationId}/cc25/definition-${clause}`,
        kind: 'definition-consumer',
        clauses: ['definition', clause],
        taskIds: tasks.map((task) => task.id),
        sourceLines: tasks.map((task) => task.requirementLine),
        modelDeclarationIds: base.declarations.map((item) => item.id),
        condition: `If ${clause} uses a Definition binding, resolve the actual lexical identity, not a similarly named local. The Definition initializer/type and its consumer must be compatible. A changed Definition requires consumer revalidation, not automatic consumer rewriting. No Definition helper is mandatory.`,
        strength: 'grounded-conditional',
        enforcement: 'hard-in-supported-structural-domain',
      };
    }
  );
  constraints.push({
    id: `${plan.operationId}/cc25/shared-binding`,
    kind: 'shared-binding-identity',
    clauses: ['definition', 'precondition', 'postcondition'],
    taskIds: plan.tasks.map((task) => task.id),
    sourceLines: plan.tasks.map((task) => task.requirementLine),
    modelDeclarationIds: base.declarations.map((item) => item.id),
    condition:
      'Group P/Q references only when they resolve to the same Definition declaration. Shadowed locals are different identities; independently queried or differently named objects are not asserted equal. Shared lexical identity is not proof of shared business identity.',
    strength: 'grounded-conditional',
    enforcement: 'hard-in-supported-structural-domain',
  });
  constraints.push({
    id: `${plan.operationId}/cc25/state`,
    kind: 'temporal-consumer',
    clauses: ['precondition', 'postcondition'],
    taskIds: plan.tasks.map((task) => task.id),
    sourceLines: plan.tasks.map((task) => task.requirementLine),
    modelDeclarationIds: base.declarations.map((item) => item.id),
    condition:
      'Keep explicit @pre and unmarked current-state accesses distinct. A changed marker requires revalidation of its AST consumers; whether the requirement demands that marker is unresolved unless independently established. Only illegal marker scope is determinately rejected.',
    strength: 'grounded-conditional',
    enforcement: 'hard-in-supported-structural-domain',
  });
  const payload = {
    version: 'cross-clause-package-v25' as const,
    base,
    constraints,
    semanticBindingPolicy:
      'No hard NL-to-object identity inferred from modelHints, taskEvidence, reference OCL or Oracle' as const,
  };
  return {...payload, hash: ccHash(payload)};
}
export type Package25 = ReturnType<typeof compilePackage25>;

// Full audit K is retained; input already contains the exact tasks/declarations.
export function compactBasePackage(pack: CrossClauseConstraintPackage) {
  const provenanceTable = [
    ...new Map(
      pack.constraints.map((item) => [ccHash(item.provenance), item.provenance])
    ).entries(),
  ];
  return {
    version: 'cross-clause-compact-input-v1',
    packageHash: pack.hash,
    planHash: pack.planHash,
    modelRulesHash: pack.modelRulesHash,
    modelIndexHash: pack.modelIndexHash,
    staticGraphHash: pack.staticGraphHash,
    signature: pack.signature,
    tasks: pack.tasks.map((item) => ({id: item.id, sha256: ccHash(item)})),
    declarations: pack.declarations.map((item) => ({id: item.id, sha256: ccHash(item)})),
    provenanceTable: Object.fromEntries(provenanceTable),
    constraints: pack.constraints.map(({provenance, ...item}) => ({
      ...item,
      provenanceRef: ccHash(provenance),
    })),
  };
}
export type CompactBasePackage = ReturnType<typeof compactBasePackage>;
export function expandCompactBasePackage(
  view: CompactBasePackage,
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding
) {
  const authoritative = compileCrossClauseConstraints(plan, context);
  if (ccHash(view) !== ccHash(compactBasePackage(authoritative)))
    throw new Error('Compact K differs from authoritative task/model mapping');
  assertCrossClausePackage(authoritative, plan, context);
  return authoritative;
}
export function compactPackage25(pack: Package25) {
  const ids = [...new Set(pack.constraints.flatMap((item) => item.modelDeclarationIds))];
  return {
    version: 'cross-clause-compact-v25',
    hash: pack.hash,
    base: compactBasePackage(pack.base),
    sharedModelDeclarationIds: ids,
    constraints: pack.constraints.map(({modelDeclarationIds, ...item}) => ({
      ...item,
      modelDeclarationSetHash: ccHash(modelDeclarationIds),
    })),
    semanticBindingPolicy: pack.semanticBindingPolicy,
  };
}
export function expandCompactPackage25(
  view: ReturnType<typeof compactPackage25>,
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding
) {
  const authoritative = compilePackage25(plan, context);
  expandCompactBasePackage(view.base, plan, context);
  if (ccHash(view) !== ccHash(compactPackage25(authoritative)))
    throw new Error('Compact M25 mapping differs from complete audit package');
  return authoritative;
}
export function assertPackage25(
  pack: Package25,
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding
) {
  if (ccHash(pack) !== ccHash(compilePackage25(plan, context)))
    throw new Error('Immutable M25 package changed');
}
export const renderPackage25 = (pack: Package25) =>
  'Cross-clause package K25 (compact, losslessly linked to the preceding authoritative T/model input). Resolve task/declaration IDs there; sha256 values audit the complete entries, not inferred answers. Keep all hard conditions; unresolved business relations are not forced.\n' +
  JSON.stringify(compactPackage25(pack));
