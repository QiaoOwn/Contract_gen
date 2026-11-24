import {ParserRuleContext} from 'antlr4';
import * as P from '../../../antlr4/REMODELParser';
import {generateContractCode, parse} from '../util';
import {validateModelGroundedContract} from './validateModelGroundedContract';
import {validateGeneratedContractSemantics} from './validateGeneratedContractSemantics';
import {auditTaskEvidence, type ConstraintTaskPlan, type TaskEvidence} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import {
  assertGraph,
  astId,
  buildStaticCrossClauseGraph,
  ccHash,
  clauseId,
  edge,
  provenance,
  sealGraph,
  type CrossClauseGraph,
  type GraphNode,
  type DependencyEdge,
} from './crossClauseGraph';

export function extractCrossClauseCandidate(
  base: CrossClauseGraph,
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding,
  candidate: RepairCandidate,
  taskEvidence: TaskEvidence[] = []
) {
  assertGraph(base);
  if (base.hash !== buildStaticCrossClauseGraph(plan, context).hash)
    throw new Error('Extractor requires the matching immutable static graph');
  const op = context.index.operation;
  const contract = generateContractCode({
    serviceName: op.service,
    operationName: op.name,
    parameters: op.parameters.map((item) => ({name: item.name, type: item.type.raw})),
    returnedType: op.returnType?.type.raw,
    ...candidate,
  });
  const parsed = parse(contract);
  const nodes: GraphNode[] = [...base.nodes];
  const edges: DependencyEdge[] = [...base.edges];
  const finish = () => sealGraph({...base, candidateHash: ccHash(candidate), nodes, edges});
  if (!parsed.tree || parsed.errors.length)
    return {
      graph: finish(),
      contract,
      parserErrors: parsed.errors,
      modelValidation: null,
      semanticDiagnostics: [],
      duplicateBindings: [] as OclLocation[],
      taskAudit: null,
    };
  const tree = parsed.tree;
  const modelValidation = validateModelGroundedContract({
    tree,
    context,
    collectRepairEvidence: true,
  });
  const semanticDiagnostics = validateGeneratedContractSemantics({
    tree,
    hasReturnValue: Boolean(op.returnType && op.returnType.type.kind !== 'void'),
  });
  const evidence = modelValidation.repairEvidence!;
  const addAst = (site: OclLocation) => {
    const id = astId(site);
    if (!nodes.some((node) => node.id === id))
      nodes.push({
        id,
        kind: 'ast',
        clause: site.clause,
        label: site.expression,
        location: site,
        provenance: provenance('parsed candidate AST', {locations: [site]}),
      });
    return id;
  };
  for (const expression of evidence.expressions) {
    const id = addAst(expression);
    for (const guard of expression.guards)
      edges.push(
        edge(
          addAst(guard),
          id,
          'DEPENDS_ON',
          provenance('enclosing conditional guard; no truth or business-causality claim', {
            locations: [guard, expression],
          })
        )
      );
    for (const bindingId of expression.bindingIds)
      edges.push(
        edge(
          bindingId,
          id,
          'DEPENDS_ON',
          provenance('resolved lexical dependency of AST expression', {locations: [expression]})
        )
      );
  }
  for (const binding of evidence.bindings) {
    if (!binding.declaration) continue; // Parameters already have authoritative declaration nodes.
    nodes.push({
      id: binding.id,
      kind: 'binding',
      clause: binding.declaration.clause,
      label: binding.name,
      location: binding.declaration,
      provenance: provenance('lexically resolved AST declaration', {
        locations: [binding.declaration],
      }),
    });
    edges.push(
      edge(
        clauseId(binding.declaration.clause),
        binding.id,
        'DECLARES',
        provenance('AST binding declaration', {locations: [binding.declaration]})
      )
    );
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const binding of evidence.bindings) {
    if (!nodeIds.has(binding.id)) continue;
    for (const use of binding.uses) {
      const id = addAst(use);
      const source = provenance('scope-resolved binding use; not a business equivalence proof', {
        locations: [use, ...(binding.declaration ? [binding.declaration] : [])],
      });
      edges.push(edge(id, binding.id, 'REFERENCES', source));
      // DEPENDS_ON points from the changed dependency to the affected consumer.
      edges.push(edge(binding.id, id, 'DEPENDS_ON', source));
    }
    for (const dependency of binding.dependsOn)
      if (nodeIds.has(dependency))
        edges.push(
          edge(
            dependency,
            binding.id,
            'DEPENDS_ON',
            provenance('binding initializer lexical dependency', {
              locations: binding.declaration ? [binding.declaration] : [],
            })
          )
        );
  }
  for (const ref of evidence.references) {
    if (nodeIds.has(ref.modelElementId))
      edges.push(
        edge(
          addAst(ref),
          ref.modelElementId,
          'REFERENCES',
          provenance('resolved model reference', {
            modelDeclarationIds: [ref.modelElementId],
            locations: [ref],
          })
        )
      );
  }
  let clause: ContractClause = 'definition';
  const duplicateBindings: OclLocation[] = [];
  const scopes = new Map<ParserRuleContext, Set<string>>();
  const location = (node: ParserRuleContext): OclLocation => ({
    clause,
    line: node.start.line,
    column: node.start.column + 1,
    endLine: node.stop?.line ?? node.start.line,
    endColumn: (node.stop?.column ?? node.start.column) + (node.stop?.text?.length ?? 1) + 1,
    startOffset: node.start.start,
    endOffset: (node.stop?.stop ?? node.start.stop) + 1,
    expression: node.getText(),
  });
  const walk = (node: ParserRuleContext, parents: ParserRuleContext[]) => {
    if (node instanceof P.RuleDefinitionContext) clause = 'definition';
    if (node instanceof P.RulePreconditionContext) clause = 'precondition';
    if (node instanceof P.RulePostconditionContext) clause = 'postcondition';
    if (node instanceof P.RuleVariableDeclarationCSContext) {
      const typeName = node.ruleTypeCS()?.getText();
      const entity = context.index.entities.find((item) => item.name === typeName);
      const bindingId = `binding:${node.start.start}:${node.ruleSimpleNameCS().getText()}`;
      if (entity && nodes.some((item) => item.id === bindingId))
        edges.push(
          edge(
            bindingId,
            entity.id,
            'HAS_DECLARED_TYPE',
            provenance(
              'explicit AST type annotation resolved to model class; not initializer or NL equivalence',
              {
                modelDeclarationIds: [entity.id],
                locations: [location(node)],
                modelSources: entity.source ? [entity.source] : [],
              }
            )
          )
        );
      const owner = [...parents]
        .reverse()
        .find(
          (parent) =>
            parent instanceof P.RuleDefinitionContext ||
            parent instanceof P.RuleIteratorExpCSContext ||
            parent instanceof P.RuleLetExpCSContext
        );
      if (owner) {
        const names = scopes.get(owner) ?? new Set<string>();
        const name = node.ruleSimpleNameCS().getText();
        if (names.has(name)) duplicateBindings.push(location(node));
        names.add(name);
        scopes.set(owner, names);
      }
    }
    if (node instanceof P.RuleIsMarkedPreCSContext) {
      const site = location(node);
      const parent = parents.at(-1) ?? node;
      const stateId = `state:pre:${site.startOffset}`;
      nodes.push({
        id: stateId,
        kind: 'state',
        label: 'pre-state read',
        clause,
        location: site,
        provenance: provenance('explicit AST @pre marker', {locations: [site]}),
      });
      edges.push(
        edge(
          addAst(location(parent)),
          stateId,
          'READS_PRESTATE',
          provenance('AST temporal marker', {locations: [site]}),
          'grounded',
          clause === 'postcondition' ? 'checked' : 'contradicted'
        )
      );
    }
    if (
      node instanceof P.RulePropertyCallExpCSContext &&
      clause === 'postcondition' &&
      !node.ruleIsMarkedPreCS()
    ) {
      const site = location(node);
      const stateId = `state:post:${site.startOffset}:${site.endOffset}`;
      nodes.push({
        id: stateId,
        kind: 'state',
        label: 'unmarked postcondition property access',
        clause,
        location: site,
        provenance: provenance(
          'postcondition AST property without @pre; not proof of an effect or state change',
          {locations: [site]}
        ),
      });
      edges.push(
        edge(
          addAst(site),
          stateId,
          'ACCESSES_POSTSTATE',
          provenance('syntactic post-state access; no inferred business effect', {
            locations: [site],
          })
        )
      );
    }
    for (const child of node.children ?? [])
      if (child instanceof ParserRuleContext) walk(child, [...parents, node]);
  };
  walk(tree, []);
  const taskAudit = taskEvidence.length
    ? auditTaskEvidence(plan, candidate, taskEvidence, context)
    : null;
  for (const link of taskAudit?.linkedTasks ?? [])
    for (const match of link.matches) {
      const task = plan.tasks.find((item) => item.id === link.taskId)!;
      const site: OclLocation = {
        clause: link.clause,
        line: match.line,
        column: match.column,
        endLine: match.line,
        endColumn: match.column,
        startOffset: match.startOffset,
        endOffset: match.endOffset,
        expression: match.expression,
      };
      edges.push(
        edge(
          task.id,
          addAst(site),
          'OBLIGATION_SUPPORT',
          provenance('AST-matched task evidence; structural only', {
            taskIds: [task.id],
            sourceLines: [task.requirementLine],
            locations: [site],
          }),
          'proposed',
          'not-checkable'
        )
      );
    }
  return {
    graph: finish(),
    contract,
    parserErrors: parsed.errors,
    modelValidation,
    semanticDiagnostics,
    duplicateBindings,
    taskAudit,
  };
}
export type CandidateExtraction = ReturnType<typeof extractCrossClauseCandidate>;
