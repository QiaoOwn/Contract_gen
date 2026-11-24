import {parse} from '../util';
import {ParserRuleContext} from 'antlr4';
import {oclSyntaxIdentity} from './validateModelGroundedContract';
import {checkCrossClauseAcceptance} from './crossClauseAcceptance';
import {ccHash, type GraphNode, type Provenance} from './crossClauseGraph';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import type {ConstraintTaskPlan, TaskEvidence} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {CrossClauseConstraintPackage} from './crossClauseConstraintCompiler';

export type DependencyKind25 =
  | 'declares'
  | 'references'
  | 'valueDependsOn'
  | 'typeDependsOn'
  | 'stateDependsOn'
  | 'sourceObligation'
  | 'proposedSemanticRelation';
export type Dependency25 = {
  id: string;
  from: string;
  to: string;
  kind: DependencyKind25;
  strength: 'grounded' | 'proposed' | 'unresolved';
  verification: 'checked' | 'unresolved';
  provenance: Provenance;
};
export type Graph25 = {
  version: 'cross-clause-dependencies-v25';
  planHash: string;
  modelRulesHash: string;
  candidateHash: string;
  nodes: GraphNode[];
  edges: Dependency25[];
  topDefinitionBindingIds: string[];
  syntaxNodes: {
    id: string;
    kind: string;
    syntax: string;
    clause: ContractClause;
    location: OclLocation;
  }[];
  parsed: boolean;
  sharedBindings: {
    bindingId: string;
    declaration: OclLocation;
    uses: OclLocation[];
    usedByClauses: ContractClause[];
    identityMeaning: 'resolved-lexical-binding-not-business-identity';
  }[];
  hash: string;
};
const add = (
  edges: Dependency25[],
  from: string,
  to: string,
  kind: DependencyKind25,
  provenance: Provenance,
  strength: Dependency25['strength'] = 'grounded',
  verification: Dependency25['verification'] = 'checked'
) => {
  edges.push({id: ccHash({from, to, kind}), from, to, kind, strength, verification, provenance});
};

export function extractDependencies25(args: {
  pack: CrossClauseConstraintPackage;
  plan: ConstraintTaskPlan;
  context: OperationModelGrounding;
  candidate: RepairCandidate;
  taskEvidence?: TaskEvidence[];
}) {
  const acceptance = checkCrossClauseAcceptance(args);
  const graph = acceptance.audit.graph!;
  const extraction = acceptance.audit.extraction!;
  const edges: Dependency25[] = [];
  for (const edge of graph.edges) {
    if (edge.kind === 'DECLARES') add(edges, edge.from, edge.to, 'declares', edge.provenance);
    if (edge.kind === 'REFERENCES') {
      add(edges, edge.from, edge.to, 'references', edge.provenance);
      if (graph.nodes.find((node) => node.id === edge.to)?.kind === 'declaration')
        add(edges, edge.to, edge.from, 'typeDependsOn', edge.provenance);
    }
    if (edge.kind === 'DEPENDS_ON')
      add(edges, edge.from, edge.to, 'valueDependsOn', edge.provenance);
    if (edge.kind === 'HAS_DECLARED_TYPE')
      add(edges, edge.to, edge.from, 'typeDependsOn', edge.provenance);
    if (edge.kind === 'READS_PRESTATE' || edge.kind === 'ACCESSES_POSTSTATE')
      add(
        edges,
        edge.to,
        edge.from,
        'stateDependsOn',
        edge.provenance,
        'grounded',
        edge.verification === 'checked' ? 'checked' : 'unresolved'
      );
    if (edge.kind === 'ASSIGNED_TO' || edge.kind === 'OBLIGATION_SUPPORT')
      add(
        edges,
        edge.from,
        edge.to,
        'sourceObligation',
        edge.provenance,
        edge.kind === 'ASSIGNED_TO' ? 'grounded' : 'proposed',
        edge.kind === 'ASSIGNED_TO' ? 'checked' : 'unresolved'
      );
  }
  // A task pair is a question for semantic validation, never an inferred same-object law.
  for (const p of args.plan.tasks.filter((task) => task.clause === 'precondition'))
    for (const q of args.plan.tasks.filter((task) => task.clause === 'postcondition'))
      add(
        edges,
        p.id,
        q.id,
        'proposedSemanticRelation',
        {
          taskIds: [p.id, q.id],
          sourceLines: [p.requirementLine, q.requirementLine],
          modelDeclarationIds: [],
          locations: [],
          basis: 'P/Q task-pair inspection; no NL entailment or business identity established',
        },
        'unresolved',
        'unresolved'
      );
  const parsed = acceptance.audit.status !== 'unparseable';
  const tree = parsed ? parse(extraction.contract).tree : null;
  const syntaxNodes: Graph25['syntaxNodes'] = [];
  const walk = (node: ParserRuleContext, clause: ContractClause) => {
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
    syntaxNodes.push({
      id: `syntax:${node.constructor.name}:${clause}:${location.startOffset}:${location.endOffset}`,
      kind: node.constructor.name,
      syntax: oclSyntaxIdentity(node),
      clause,
      location,
    });
    for (const child of node.children ?? [])
      if (child instanceof ParserRuleContext) walk(child, clause);
  };
  if (tree) {
    const definition = tree.ruleDefinition();
    if (definition) walk(definition, 'definition');
    walk(tree.rulePrecondition(), 'precondition');
    walk(tree.rulePostcondition(), 'postcondition');
  }
  const topOffsets = new Set(
    tree
      ?.ruleDefinition()
      ?.ruleVariableDeclarationCS_list()
      .map((node) => node.start.start) ?? []
  );
  const bindings = extraction.modelValidation?.repairEvidence?.bindings ?? [];
  const top = bindings.filter(
    (binding) => binding.declaration && topOffsets.has(binding.declaration.startOffset)
  );
  const payload: Omit<Graph25, 'hash'> = {
    version: 'cross-clause-dependencies-v25',
    planHash: args.plan.hash,
    modelRulesHash: args.context.rules.rulesHash,
    candidateHash: ccHash(args.candidate),
    nodes: graph.nodes,
    edges: [...new Map(edges.map((edge) => [edge.id, edge])).values()].sort((a, b) =>
      a.id.localeCompare(b.id)
    ),
    topDefinitionBindingIds: top.map((binding) => binding.id),
    parsed,
    syntaxNodes,
    sharedBindings: top.map((binding) => ({
      bindingId: binding.id,
      declaration: binding.declaration!,
      uses: binding.uses,
      usedByClauses: [...new Set(binding.uses.map((use) => use.clause))],
      identityMeaning: 'resolved-lexical-binding-not-business-identity',
    })),
  };
  return {acceptance, graph: {...payload, hash: ccHash(payload)} as Graph25};
}

export function assertDependencies25(graph: Graph25) {
  const {hash, ...payload} = graph;
  if (hash !== ccHash(payload)) throw new Error('M25 dependency graph integrity mismatch');
}

export function impactDependencies25(before: Graph25, after: Graph25) {
  assertDependencies25(before);
  assertDependencies25(after);
  if (before.planHash !== after.planHash || before.modelRulesHash !== after.modelRulesHash)
    throw new Error('M25 comparison requires one frozen T/model');
  type Ref = {
    snapshot: 'before' | 'after';
    id: string;
    clause?: ContractClause;
    location?: OclLocation;
  };
  const ref = (node: GraphNode, snapshot: Ref['snapshot']): Ref => ({
    snapshot,
    id: node.id,
    clause: node.clause,
    location: node.location,
  });
  const candidates = (graph: Graph25) =>
    graph.nodes.filter(
      (node) => node.kind === 'ast' || node.kind === 'binding' || node.kind === 'state'
    );
  const key = (node: GraphNode) =>
    JSON.stringify([node.kind, node.clause, node.label, node.location?.expression]);
  const unmatched = (left: Graph25, right: Graph25) => {
    const counts = new Map<string, number>();
    for (const node of candidates(right)) counts.set(key(node), (counts.get(key(node)) ?? 0) + 1);
    return candidates(left).filter((node) => {
      const n = counts.get(key(node)) ?? 0;
      if (n) {
        counts.set(key(node), n - 1);
        return false;
      }
      return true;
    });
  };
  // Match syntax as a multiset, not by byte offset; insertions must not mark every later site changed.
  const removed = unmatched(before, after).filter(
    (node) =>
      node.kind !== 'ast' ||
      !after.syntaxNodes.some(
        (site) =>
          site.clause === node.clause && site.location.expression === node.location?.expression
      )
  );
  const added = unmatched(after, before).filter(
    (node) =>
      node.kind !== 'ast' ||
      !before.syntaxNodes.some(
        (site) =>
          site.clause === node.clause && site.location.expression === node.location?.expression
      )
  );
  const changedSyntax = (left: Graph25, right: Graph25, snapshot: Ref['snapshot']) => {
    const counts = new Map<string, number>();
    const syntaxKey = (site: Graph25['syntaxNodes'][number]) =>
      JSON.stringify([site.clause, site.syntax]);
    for (const site of right.syntaxNodes)
      counts.set(syntaxKey(site), (counts.get(syntaxKey(site)) ?? 0) + 1);
    return left.syntaxNodes
      .filter((site) => {
        const count = counts.get(syntaxKey(site)) ?? 0;
        if (count) {
          counts.set(syntaxKey(site), count - 1);
          return false;
        }
        return true;
      })
      .map((site) => ({snapshot, id: site.id, clause: site.clause, location: site.location}));
  };
  const scan = (graph: Graph25, roots: GraphNode[], snapshot: Ref['snapshot']) => {
    const allowed = graph.edges.filter(
      (edge) =>
        edge.strength === 'grounded' &&
        edge.verification === 'checked' &&
        ['valueDependsOn', 'typeDependsOn', 'stateDependsOn'].includes(edge.kind)
    );
    const adjacency = new Map<string, string[]>();
    for (const edge of allowed)
      adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
    const reached = new Set(roots.map((node) => node.id));
    const direct = new Set(roots.flatMap((node) => adjacency.get(node.id) ?? []));
    const queue = [...reached];
    for (let i = 0; i < queue.length; i++)
      for (const id of adjacency.get(queue[i]) ?? [])
        if (!reached.has(id)) {
          reached.add(id);
          queue.push(id);
        }
    return {
      direct: graph.nodes.filter((node) => direct.has(node.id)).map((node) => ref(node, snapshot)),
      all: graph.nodes.filter((node) => reached.has(node.id)).map((node) => ref(node, snapshot)),
    };
  };
  const old = scan(before, removed, 'before'),
    next = scan(after, added, 'after');
  const changedNodes = [
    ...changedSyntax(before, after, 'before'),
    ...changedSyntax(after, before, 'after'),
  ];
  const mustRevalidate = [...old.all, ...next.all, ...changedNodes];
  const rootClauses = new Set(changedNodes.map((node) => node.clause));
  const affectedClauses = [
    ...new Set(mustRevalidate.flatMap((node) => (node.clause ? [node.clause] : []))),
  ].sort();
  const unresolvedDependencies = [...before.edges, ...after.edges].filter(
    (edge) => edge.strength !== 'grounded' || edge.verification !== 'checked'
  );
  return {
    version: 'cross-clause-impact-v25',
    changedNodes,
    changedDependencyNodes: [
      ...removed.map((node) => ref(node, 'before')),
      ...added.map((node) => ref(node, 'after')),
    ],
    directDependents: [...old.direct, ...next.direct],
    mustRevalidate,
    affectedClauses,
    crossClauseDependents: [...old.all, ...next.all].filter(
      (node) => node.clause && !rootClauses.has(node.clause)
    ),
    unresolvedDependencies: [
      ...new Map(unresolvedDependencies.map((edge) => [edge.id, edge])).values(),
    ],
    revalidation: {
      performed: false,
      clauses: [] as ContractClause[],
      scope: 'impact-query-only; execution must be recorded by the caller',
    },
    mayEdit: [] as string[],
    authorization: 'revalidation-only-no-M3-edit-authority',
  };
}
