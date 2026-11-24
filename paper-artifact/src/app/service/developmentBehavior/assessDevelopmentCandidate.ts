import {evaluateDevelopmentBehavior} from './evaluateDevelopmentBehavior';
import {developmentRegistry, validateDevelopmentReport} from './registry';
import {developmentRepairDiagnostics} from './developmentRepair';
import type {OperationModelGrounding} from '../operationModelGrounding';
import type {RepairCandidate} from '../repairLocalization';
import type {RepairDiagnostic} from '../repairDiagnostics';
import type {DevelopmentBehaviorReport} from './types';
import {formatStructuredRequirement,getBenchmarkRequirement} from '@/rm2pt/benchmarkRequirements';
import {narrativeDevelopmentProfile} from './narrativeDevelopmentProfiles';
import {runtimeDereferenceDiagnostics,runtimePredicateDiagnostics} from './runtimeDereferenceRepair';

export type DevelopmentCandidateAssessment = {
 status: 'PASS' | 'FAIL' | 'UNRESOLVED' | 'NOT_EVALUATED';
 basis: 'finite-public-development-scenarios';
 report: DevelopmentBehaviorReport | null;
 feedbackDiagnostics: RepairDiagnostic[];
 reason: string;
 hiddenEvaluationUsed: false;
};

/** Opt-in development evidence, never an alias for hidden behavioral acceptance. */
export async function assessDevelopmentCandidate(input: {
 enabled: boolean; preExecValid: boolean; entry?: string;
 requirement: string; candidate: RepairCandidate; context: OperationModelGrounding;
}): Promise<DevelopmentCandidateAssessment> {
 const result = (status: DevelopmentCandidateAssessment['status'], reason: string,
  report: DevelopmentBehaviorReport | null = null, feedbackDiagnostics: RepairDiagnostic[] = []): DevelopmentCandidateAssessment =>
  ({status, basis: 'finite-public-development-scenarios', report, feedbackDiagnostics, reason, hiddenEvaluationUsed: false});
 if(!input.enabled)return result('NOT_EVALUATED','Development validation is disabled');
 if(!input.preExecValid||!input.entry)return result('NOT_EVALUATED','PreExec must pass before executing development scenarios');
 if(!input.requirement.trim())return result('UNRESOLVED','The actual generation requirement is required');
 let report: DevelopmentBehaviorReport;
 let profile:ReturnType<typeof narrativeDevelopmentProfile>=null;
 try {
  const op=input.context.index;
  const registration=developmentRegistry.require({project:op.project,useCase:op.useCase,operation:op.operation.name});
  profile=narrativeDevelopmentProfile(registration.id,input.requirement);
  if(profile&&(profile.obligations.length!==registration.obligations.length||profile.obligations.some(o=>!registration.obligations.some(r=>r.id===o.id&&r.clause===o.clause))))
   return result('UNRESOLVED','Public Narrative obligation mapping does not match the development registration');
  const registeredRequirement=formatStructuredRequirement(getBenchmarkRequirement(op.project,op.useCase,op.operation.name));
  const normalize=(value:string)=>value.replaceAll('\r\n','\n').trim();
  if(!profile&&normalize(input.requirement)!==normalize(registeredRequirement))
   return result('UNRESOLVED','Current development scenarios are registered against Structured input; this generation requirement has not been aligned. No diagnostic feedback is authorized.');
  report=validateDevelopmentReport(await evaluateDevelopmentBehavior(input.entry,input.requirement,registration.id),registration);
 }catch(error){
  // Missing registrations, source drift and worker failures are not candidate failures.
  return result('UNRESOLVED',`Development evidence unavailable: ${String(error)}`);
 }
 const diagnostics=developmentRepairDiagnostics(report,input.context,input.candidate);
 const feedback=diagnostics.filter(d=>d.repairEligible&&d.classification.disposition==='repair-candidate'&&
  (!profile||d.obligationIds.every(id=>profile!.obligations.some(o=>o.id===id)))).map(d=>profile?{
   ...d,requirementEvidence:d.requirementEvidence?.map(e=>({...e,
    requirement:profile!.obligations.find(o=>o.id===e.id)!.text,
    narrativeSource:{sourceHash:profile!.sourceHash,profileVersion:profile!.profileVersion,
     start:profile!.obligations.find(o=>o.id===e.id)!.start,end:profile!.obligations.find(o=>o.id===e.id)!.end,
     provenance:profile!.provenance}}))}:d);
 if(report.businessStatus==='mismatched'||report.executionConventionStatus==='mismatched')
  return result('FAIL','A finite development observation mismatched; source-grounded business or localized public runtime evidence may guide repair',report,[...feedback,...runtimeDereferenceDiagnostics(report,input.candidate,input.context),...runtimePredicateDiagnostics(report,input.candidate,input.context)]);
 if(report.passed&&report.businessStatus==='matched'&&report.executionConventionStatus==='matched'&&report.unobservedObligationIds.length===0)
  return result('PASS','All registered development observations matched; this is not a hidden-Oracle or universal semantic guarantee',report);
 return result('UNRESOLVED','Development observations are inconclusive or obligations remain unobserved',report);
}
