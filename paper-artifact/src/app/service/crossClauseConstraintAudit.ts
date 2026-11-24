import type {ConstraintTaskPlan, TaskEvidence} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import {
  buildStaticCrossClauseGraph,
  mergeCandidateGraph,
  provenance,
  type Provenance,
} from './crossClauseGraph';
import {extractCrossClauseCandidate} from './crossClauseAstExtractor';

export type CrossClauseDiagnostic = {
  code:
    | 'CC-PARSE'
    | 'CC-SCOPE'
    | 'CC-TYPE'
    | 'CC-TEMPORAL'
    | 'CC-DEPENDENCY'
    | 'CC-RESULT-SCOPE'
    | 'CC-SEMANTIC-UNRESOLVED';
  status: 'conflict' | 'unresolved';
  clause?: ContractClause;
  location?: OclLocation;
  reliablyLocated: boolean;
  constraint: string;
  message: string;
  provenance: Provenance;
  underlyingCode?: string;
};
export function auditCrossClauseContract(args: {
  enabled: boolean;
  plan: ConstraintTaskPlan;
  context: OperationModelGrounding;
  candidate: RepairCandidate;
  taskEvidence?: TaskEvidence[];
}) {
  if (!args.enabled)
    return {
      enabled: false as const,
      status: 'disabled' as const,
      graph: null,
      staticGraph: null,
      diagnostics: [] as CrossClauseDiagnostic[],
      extraction: null,
    };
  const base = buildStaticCrossClauseGraph(args.plan, args.context);
  const extracted = extractCrossClauseCandidate(
    base,
    args.plan,
    args.context,
    args.candidate,
    args.taskEvidence
  );
  const graph = mergeCandidateGraph(base, extracted.graph);
  const diagnostics: CrossClauseDiagnostic[] = [];
  const sourceFor = (clause?: ContractClause, site?: OclLocation, ids: string[] = []) => {
    const tasks = args.plan.tasks.filter((task) => task.clause === clause);
    return provenance('validator fact; clause task links are context, not semantic proof', {
      taskIds: tasks.map((task) => task.id),
      sourceLines: tasks.map((task) => task.requirementLine),
      modelDeclarationIds: ids,
      locations: site ? [site] : [],
    });
  };
  for (const error of extracted.parserErrors)
    diagnostics.push({
      code: 'CC-PARSE',
      status: 'conflict',
      reliablyLocated: false,
      constraint: 'Candidate must parse before AST dependency analysis',
      message: error.msg,
      provenance: sourceFor(),
    });
  for (const error of extracted.modelValidation?.diagnostics ?? []) {
    const code =
      error.code === 'RESULT_SCOPE'
        ? 'CC-RESULT-SCOPE'
        : [
              'UNBOUND_VARIABLE',
              'STATE_REQUIRES_SELF',
              'PARAMETER_IS_NOT_STATE',
              'UNKNOWN_SERVICE_STATE',
            ].includes(error.code)
          ? 'CC-SCOPE'
          : 'CC-TYPE';
    diagnostics.push({
      code,
      status: 'conflict',
      clause: error.clause,
      location: error,
      reliablyLocated: true,
      underlyingCode: error.code,
      constraint: error.repair,
      message: error.msg,
      provenance: sourceFor(error.clause, error, error.modelElementIds),
    });
  }
  for (const error of extracted.semanticDiagnostics) {
    if (
      !['DIA_PRESTATE_SCOPE', 'DIA_RESULT_SCOPE', 'DIA_RESULT_WITHOUT_RETURN'].includes(error.code)
    )
      continue;
    const site = graph.nodes.find(
      (node) => node.location?.line === error.line && node.location?.column === error.column
    )?.location;
    diagnostics.push({
      code: error.code === 'DIA_PRESTATE_SCOPE' ? 'CC-TEMPORAL' : 'CC-RESULT-SCOPE',
      status: 'conflict',
      clause: error.clause,
      location: site,
      reliablyLocated: Boolean(site),
      underlyingCode: error.code,
      constraint: error.msg,
      message: error.msg,
      provenance: sourceFor(error.clause, site),
    });
  }
  for (const site of extracted.duplicateBindings)
    diagnostics.push({
      code: 'CC-SCOPE',
      status: 'conflict',
      clause: site.clause,
      location: site,
      reliablyLocated: true,
      constraint: 'Names must be unique in one lexical declaration scope',
      message: 'Duplicate binding in the same scope.',
      provenance: sourceFor(site.clause, site),
    });
  for (const site of extracted.modelValidation?.deferred ?? [])
    diagnostics.push({
      code: 'CC-TYPE',
      status: 'unresolved',
      clause: site.clause,
      location: site,
      reliablyLocated: true,
      constraint: 'Do not treat deferred type inference as proven compatibility',
      message: 'Existing model checker deferred this AST form.',
      provenance: sourceFor(site.clause, site),
    });
  for (const issue of extracted.taskAudit?.issues ?? [])
    diagnostics.push({
      code: 'CC-DEPENDENCY',
      status: 'unresolved',
      clause: issue.clause,
      reliablyLocated: false,
      underlyingCode: issue.code,
      constraint: 'Only actual AST evidence may establish structural task links',
      message: issue.message,
      provenance: sourceFor(issue.clause),
    });
  // Every NL task remains semantically unproved even when its AST evidence is present.
  for (const task of args.plan.tasks)
    diagnostics.push({
      code: 'CC-SEMANTIC-UNRESOLVED',
      status: 'unresolved',
      clause: task.clause,
      reliablyLocated: false,
      constraint: 'AST binding agreement is not NL semantic equivalence',
      message:
        'Business obligation satisfaction requires independent behavioral evidence; lexical hints are not hard target bindings.',
      provenance: provenance('frozen requirement, semantic interpretation not decided by M1', {
        taskIds: [task.id],
        sourceLines: [task.requirementLine],
      }),
    });
  return {
    enabled: true as const,
    status: extracted.parserErrors.length
      ? ('unparseable' as const)
      : diagnostics.some((item) => item.status === 'conflict')
        ? ('conflict' as const)
        : ('no-determined-conflict' as const),
    graph,
    staticGraph: base,
    diagnostics,
    extraction: extracted,
  };
}
