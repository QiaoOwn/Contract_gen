import assert from 'node:assert/strict';
import {ordinaryLoop3,digest3,type Contract3} from './rq3OrdinaryRepair';
import {compactRejectionFeedback,isRepairInputBudgetError} from './lib/repairRequestBudget';
import type {DevelopmentCandidateAssessment} from '../src/app/service/developmentBehavior/assessDevelopmentCandidate';

type Options=Parameters<typeof ordinaryLoop3>[0]&{
 developmentCheck?: (candidate:Contract3,evaluation:Awaited<ReturnType<Parameters<typeof ordinaryLoop3>[0]['evaluate']>>)=>Promise<DevelopmentCandidateAssessment>;
};
/** Rejected proposals are observations, not new candidates or new authority. */
export async function permissionRetryLoopV2(options:Options){
 assert(!options.developmentCheck||options.strategy==='dependency-guided','Development gate requires an explicitly configured dependency-guided loop');
 if(options.strategy!=='dependency-guided')return ordinaryLoop3(options);
 assert(options.prepare&&options.audit);
 assert(Number.isInteger(options.maximum)&&options.maximum>=1&&options.maximum<=4);
 assert(Number.isInteger(options.consumed)&&options.consumed>=0&&options.consumed+options.maximum<=5);
 let candidate=structuredClone(options.initial),diagnostics=structuredClone(options.initialDiagnostics),previous:Contract3|undefined;
 let pending:unknown=null,stop='budget-exhausted',calls=0,stagnant=0;
 const events:any[]=[],seen=new Set([options.identity(candidate)]),rejected=new Set<string>();
 const immutable=digest3({base:options.base,initial:options.initial,initialDiagnostics:options.initialDiagnostics});
 const verify=()=>{options.verify();assert.equal(digest3({base:options.base,initial:options.initial,initialDiagnostics:options.initialDiagnostics}),immutable);};
 for(let attempt=1;attempt<=options.maximum;attempt++){
  verify();const planned=options.prepare(candidate,diagnostics,previous);
  if(planned.blocked){stop='unresolved-permission';const event={attempt,status:stop,permission:planned.plan};events.push(event);options.record(attempt,event);break;}
  let messages=structuredClone(planned.messages);
  if(pending)messages.push({role:'user',content:JSON.stringify(pending)});
  messages=compactRejectionFeedback(messages);
  options.request?.(attempt,messages);calls++;
  let raw:unknown;
  try{raw=await options.transport(messages,attempt);}catch(e){stop=isRepairInputBudgetError(e)?'input-budget-blocked':'transport-or-response-stop';if(isRepairInputBudgetError(e))calls--;const event={attempt,status:stop,error:String(e)};events.push(event);options.record(attempt,event);break;}
  verify();const formatted=options.normalize(raw);let evaluation;
  try{evaluation=await options.evaluate(formatted.normalized);}catch(e){stop='evaluation-infrastructure-stop';const event={attempt,status:stop,error:String(e),raw,formatChanges:formatted.changes};events.push(event);options.record(attempt,event);break;}
  if(!evaluation.publicProtocolValid){stop='protocol-rejected';const event={attempt,status:stop,raw,evaluation,formatChanges:formatted.changes};events.push(event);options.record(attempt,event);break;}
  const proposal=(formatted.normalized as {contract:Contract3}).contract;assert(proposal);
  const permission=options.audit(proposal,planned.plan),id=options.identity(proposal),oldId=options.identity(candidate);
  let development:DevelopmentCandidateAssessment|null=null;
  if(evaluation.evaluation?.preExecValid&&permission.passed&&!permission.acceptanceBlocked&&options.developmentCheck){
   try{development=await options.developmentCheck(proposal,evaluation);}
   catch(error){stop='development-infrastructure-stop';const event={attempt,status:stop,error:String(error),candidate:proposal,raw,evaluation};events.push(event);options.record(attempt,event);break;}
  }
  const event={attempt,status:'evaluated',previousCandidate:structuredClone(candidate),candidate:proposal,evaluation,raw,
   formatChanges:formatted.changes,changedClauses:(['definition','precondition','postcondition']as const).filter(k=>(candidate[k]??'')!==(proposal[k]??'')),
   astChanged:id!==oldId,permissionPassed:permission.passed,methodConstraintPassed:!permission.acceptanceBlocked,
   permissionAudit:permission.details,permissionPlan:planned.plan,preExecValid:evaluation.evaluation?.preExecValid===true,
   ...(options.developmentCheck?{development}:{}),
   proposalDisposition:permission.passed?'permission-accepted':'permission-rejected',baselineAdvanced:permission.passed};
  events.push(event);options.record(attempt,event);
  if(!permission.passed){
   const details=permission.details as any;
   const optionsAudit=details?.optionAudits??[{optionId:details?.matchedOption??'current',audit:details}];
   pending={version:'permission-rejection-feedback-v1',rejectedProposal:structuredClone(proposal),
    proposalValidatorDiagnostics:evaluation.evaluation?.diagnostics??[],
    proposalPreExecValid:evaluation.evaluation?.preExecValid===true,
    rejectedAttempt:attempt,baselineCandidateHash:digest3(candidate),
    violations:optionsAudit.map((x:any)=>({optionId:x.optionId,parsed:x.audit?.parsed,
     unauthorized:(x.audit?.unauthorized??[]).map((v:any)=>({clause:v.clause,path:v.path,reason:v.reason})),
     protectedViolations:(x.audit?.protectedViolations??[]).map((v:any)=>({clause:v.clause,path:v.path,reason:v.reason}))})),
    instruction:'The previous proposal was NOT accepted. Start from currentContract in the preceding directive, not this rejected proposal. Correct the edit-scope violations within ONE existing authorized option. Also fix the supplied proposalValidatorDiagnostics: an unparseable or type-invalid proposal is not repaired by resubmitting identical text. Restore all protected regions. Permission and original diagnostics are unchanged. Do not add Definition aliases or rewrite other clauses unless that option explicitly authorizes them. No behavioral test result is provided.'};
   if(rejected.has(id)){stop='repeated-permission-rejection';break;}
   rejected.add(id);if(attempt===options.maximum){stop='permission-budget-exhausted';break;}
   continue;
  }
  pending=null;const unchanged=id===oldId,cycle=!unchanged&&seen.has(id);seen.add(id);stagnant=unchanged?stagnant+1:0;
  previous=structuredClone(candidate);candidate=structuredClone(proposal);
  diagnostics=structuredClone([...(evaluation.evaluation?.diagnostics??[]),...(permission.feedbackDiagnostics??[]),...(development?.feedbackDiagnostics??[])]);
  if(event.preExecValid&&!permission.acceptanceBlocked){
   if(!options.developmentCheck){stop='preexec-valid';break;}
   if(development?.status==='PASS'){stop='preexec-and-development-valid';break;}
   if(development?.status!=='FAIL'){stop='development-unresolved';break;}
  }
  if(cycle){stop='candidate-cycle';break;}if(stagnant>=2){stop='two-unchanged-rounds';break;}
  if(!diagnostics.length){stop='no-actionable-validator-feedback';break;}
 }
 verify();return {version:'rq3-permission-retry-v2',strategy:'dependency-guided',candidate,stop,newLogicalCalls:calls,totalCallsIncludingInitial:options.consumed+calls,events,hiddenJestEvaluations:0,behavior:'not-evaluated',scope:'Rejected proposals never advance the baseline, alter diagnostic authority or expand edit permissions; bounded retry uses permission evidence only'};
}
