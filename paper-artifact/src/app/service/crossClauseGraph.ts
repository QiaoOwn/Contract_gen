import {createHash} from 'node:crypto';
import {assertConstraintTaskPlan, type ConstraintTaskPlan} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import type {ModelSource} from './modelIndex';

export const CROSS_CLAUSE_VERSION = 'cross-clause-analysis-v1';
export type EvidenceLevel = 'grounded' | 'proposed' | 'unresolved';
export type Provenance = {
  taskIds: string[];
  sourceLines: number[];
  modelDeclarationIds: string[];
  locations: OclLocation[];
  basis: string;
  modelSources?: ModelSource[];
};
export type GraphNode = {
  id: string;
  kind: 'task' | 'declaration' | 'clause' | 'binding' | 'ast' | 'state';
  label: string;
  clause?: ContractClause;
  location?: OclLocation;
  provenance: Provenance;
};
export type EdgeKind =
  | 'ASSIGNED_TO'
  | 'DECLARES'
  | 'REFERENCES'
  | 'DEPENDS_ON'
  | 'HAS_DECLARED_TYPE'
  | 'READS_PRESTATE'
  | 'ACCESSES_POSTSTATE'
  | 'OBLIGATION_SUPPORT'
  | 'USES_SAME_TARGET';
export type DependencyEdge = {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  evidenceLevel: EvidenceLevel;
  verification: 'checked' | 'not-checkable' | 'contradicted';
  provenance: Provenance;
};
export type CrossClauseGraph = {
  version: typeof CROSS_CLAUSE_VERSION;
  taskPlanHash: string;
  modelRulesHash: string;
  candidateHash?: string;
  nodes: GraphNode[];
  edges: DependencyEdge[];
  hash: string;
};
export const ccHash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const provenance = (basis: string, extra: Partial<Provenance> = {}): Provenance => ({
  taskIds: [],
  sourceLines: [],
  modelDeclarationIds: [],
  locations: [],
  basis,
  ...extra,
});
export const clauseId = (clause: ContractClause) => `clause:${clause}`;
export const astId = (site: OclLocation) =>
  `ast:${site.clause}:${site.startOffset}:${site.endOffset}`;
export function edge(
  from: string,
  to: string,
  kind: EdgeKind,
  source: Provenance,
  evidenceLevel: EvidenceLevel = 'grounded',
  verification: DependencyEdge['verification'] = 'checked'
): DependencyEdge {
  return {
    id: ccHash({from, to, kind}),
    from,
    to,
    kind,
    evidenceLevel,
    verification,
    provenance: source,
  };
}
export function sealGraph(value: Omit<CrossClauseGraph, 'hash'>): CrossClauseGraph {
  const nodes = [...new Map(value.nodes.map((node) => [node.id, node])).values()].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const edges = [...new Map(value.edges.map((item) => [item.id, item])).values()].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const ids = new Set(nodes.map((node) => node.id));
  if (edges.some((item) => !ids.has(item.from) || !ids.has(item.to)))
    throw new Error('Dangling cross-clause edge');
  const payload = {
    version: value.version,
    taskPlanHash: value.taskPlanHash,
    modelRulesHash: value.modelRulesHash,
    ...(value.candidateHash ? {candidateHash: value.candidateHash} : {}),
    nodes,
    edges,
  };
  return {...payload, hash: ccHash(payload)};
}
export function assertGraph(graph: CrossClauseGraph) {
  const {hash, ...payload} = graph;
  if (graph.version !== CROSS_CLAUSE_VERSION || hash !== ccHash(payload))
    throw new Error('Cross-clause graph integrity mismatch');
}
export function buildStaticCrossClauseGraph(
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding
): CrossClauseGraph {
  assertConstraintTaskPlan(plan, context);
  const nodes: GraphNode[] = (
    ['definition', 'precondition', 'postcondition'] as ContractClause[]
  ).map((clause) => ({
    id: clauseId(clause),
    kind: 'clause',
    clause,
    label: clause,
    provenance: provenance('contract structure'),
  }));
  const edges: DependencyEdge[] = [];
  for (const item of plan.declarations)
    nodes.push({
      id: item.id,
      kind: 'declaration',
      label: item.declaration,
      provenance: provenance('authoritative model declaration', {
        modelDeclarationIds: [item.id],
        modelSources: item.source ? [item.source] : [],
      }),
    });
  for (const task of plan.tasks) {
    const source = provenance('frozen requirement bullet; no inferred business binding', {
      taskIds: [task.id],
      sourceLines: [task.requirementLine],
    });
    nodes.push({
      id: task.id,
      kind: 'task',
      clause: task.clause,
      label: task.requirement,
      provenance: source,
    });
    edges.push(edge(task.id, clauseId(task.clause), 'ASSIGNED_TO', source));
    // Lexical hints are deliberately not converted into model-dependency edges.
  }
  return sealGraph({
    version: CROSS_CLAUSE_VERSION,
    taskPlanHash: plan.hash,
    modelRulesHash: context.rules.rulesHash,
    nodes,
    edges,
  });
}
export function mergeCandidateGraph(
  base: CrossClauseGraph,
  candidate: CrossClauseGraph
): CrossClauseGraph {
  assertGraph(base);
  assertGraph(candidate);
  if (
    base.candidateHash ||
    !candidate.candidateHash ||
    base.taskPlanHash !== candidate.taskPlanHash ||
    base.modelRulesHash !== candidate.modelRulesHash
  )
    throw new Error('Cross-clause graph identity mismatch');
  const baseNodes = new Map(base.nodes.map((node) => [node.id, node]));
  for (const node of candidate.nodes)
    if (baseNodes.has(node.id) && ccHash(node) !== ccHash(baseNodes.get(node.id)))
      throw new Error('Candidate attempted to overwrite an authoritative graph node');
  const baseEdges = new Map(base.edges.map((item) => [item.id, item]));
  for (const item of candidate.edges)
    if (baseEdges.has(item.id) && ccHash(item) !== ccHash(baseEdges.get(item.id)))
      throw new Error('Candidate attempted to overwrite an authoritative graph edge');
  return sealGraph({
    ...candidate,
    nodes: [...base.nodes, ...candidate.nodes],
    edges: [...base.edges, ...candidate.edges],
  });
}
