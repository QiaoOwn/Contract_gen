import {assertGraph, type CrossClauseGraph} from './crossClauseGraph';

export function dependencyConsumers(graph: CrossClauseGraph, roots: string[]) {
  assertGraph(graph);
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (roots.some((id) => !ids.has(id))) throw new Error('Unknown impact root');
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges)
    if (
      edge.kind === 'DEPENDS_ON' &&
      edge.evidenceLevel === 'grounded' &&
      edge.verification === 'checked'
    )
      adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  const reached = new Set(roots);
  const queue = [...roots];
  for (let i = 0; i < queue.length; i++)
    for (const next of adjacency.get(queue[i]) ?? [])
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
  return [...reached].sort();
}
export function queryCrossClauseImpact(graph: CrossClauseGraph, roots: string[]) {
  const mustRevalidate = dependencyConsumers(graph, roots);
  return {
    roots,
    mustRevalidate,
    affectedClauses: [
      ...new Set(
        graph.nodes
          .filter((node) => mustRevalidate.includes(node.id))
          .flatMap((node) => (node.clause ? [node.clause] : []))
      ),
    ].sort(),
    mayEdit: [] as string[],
    authorization: 'query-only-no-repair-authority' as const,
  };
}

export function compareDefinitionDependencies(
  previous: CrossClauseGraph,
  current: CrossClauseGraph
) {
  assertGraph(previous);
  assertGraph(current);
  if (
    previous.taskPlanHash !== current.taskPlanHash ||
    previous.modelRulesHash !== current.modelRulesHash
  )
    throw new Error('Dependency comparison requires the same frozen task/model');
  const definitions = (graph: CrossClauseGraph) =>
    graph.nodes.filter((node) => node.kind === 'binding' && node.clause === 'definition');
  const next = new Map(definitions(current).map((node) => [node.label, node]));
  const changed = definitions(previous).filter(
    (node) =>
      !next.has(node.label) ||
      next.get(node.label)!.location?.expression !== node.location?.expression
  );
  return {
    code: 'CC-DEPENDENCY' as const,
    status: 'revalidation-required-not-automatic-error' as const,
    changes: changed.map((node) => ({
      binding: node.label,
      declaration: node.location,
      ...queryCrossClauseImpact(previous, [node.id]),
    })),
    coordinateSpace: 'previous-candidate' as const,
    mayEdit: [] as string[],
  };
}
