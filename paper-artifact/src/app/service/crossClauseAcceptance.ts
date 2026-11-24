import {auditCrossClauseContract} from './crossClauseConstraintAudit';
import {assertCrossClausePackage, type CrossClauseConstraintPackage} from './crossClauseConstraintCompiler';
import {ccHash} from './crossClauseGraph';
import type {ConstraintTaskPlan, TaskEvidence} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';
import {classifyRepairDiagnostic} from './repairTaxonomy';

export function checkCrossClauseAcceptance(args: {pack: CrossClauseConstraintPackage; plan: ConstraintTaskPlan;
  context: OperationModelGrounding; candidate: RepairCandidate; taskEvidence?: TaskEvidence[]}) {
  assertCrossClausePackage(args.pack, args.plan, args.context);
  const audit = auditCrossClauseContract({enabled: true, ...args});
  const decisions = args.pack.constraints.map(constraint => {
    const findings = audit.diagnostics.filter(item => item.code === constraint.checker);
    const violations = findings.filter(item => item.status === 'conflict');
    const status = constraint.enforcement === 'advisory' || audit.status === 'unparseable' || findings.some(item => item.status === 'unresolved')
      ? 'unresolved' as const : 'satisfied' as const;
    // Task evidence is checked by its existing checker, not inferred from missing CC findings.
    return {constraintId: constraint.id, kind: constraint.kind,
      status: violations.length ? 'violated' as const : constraint.kind === 'task-support' ?
        audit.extraction?.taskAudit ? audit.extraction.taskAudit.issues.length ? 'violated' as const : 'satisfied' as const : 'unresolved' as const : status,
      findings};
  });
  const diagnostics: RepairDiagnostic[] = [];
  for (const decision of decisions) if (decision.status === 'violated') {
    const constraint = args.pack.constraints.find(item => item.id === decision.constraintId)!;
    for (const finding of decision.findings.filter(item => item.status === 'conflict')) {
      diagnostics.push({stage: 'model', classification: classifyRepairDiagnostic('model', 'CC_CONSTRAINT_VIOLATION', {modelRule: true}),
        category: 'model-structure', code: `CC_CONSTRAINT_VIOLATION:${finding.code}`, msg: `${constraint.id}: ${finding.message}`,
        repairEligible: true, obligationIds: finding.provenance.taskIds, ruleIds: [constraint.id],
        modelEvidence: args.plan.declarations.filter(item => finding.provenance.modelDeclarationIds.includes(item.id))
          .map(item => ({id: item.id, declaration: item.declaration, source: item.source})),
        location: {resolution: finding.location ? 'ocl-expression' : finding.clause ? 'clause-only' : 'unknown',
          clause: finding.clause, line: finding.location?.line, column: finding.location ? finding.location.column - 1 : undefined},
        repair: `${constraint.condition} Preserve the original tasks, model, K and unaffected clauses. Repair the candidate only.`});
    }
  }
  return {version: 'cross-clause-acceptance-v1', packageHash: args.pack.hash, candidateHash: ccHash(args.candidate),
    blocked: decisions.some(item => item.status === 'violated'), decisions, diagnostics, audit};
}
