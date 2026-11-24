import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export type Contract3={definition?:string|null;precondition:string;postcondition:string};
export type Message3={role:string;content:string};
export type Evaluation3={publicProtocolValid:boolean;evaluation:null|{preExecValid:boolean;diagnostics:unknown[];[key:string]:unknown};[key:string]:unknown};
export type Strategy3='simple'|'conversational'|'dependency-guided';
export const digest3=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function ordinaryRequest3(base:Message3[],candidate:Contract3,diagnostics:unknown[]){
 const errors=diagnostics.map(value=>{
  const d=value&&typeof value==='object'?value as Record<string,any>:{};
  const location=d.location&&typeof d.location==='object'?d.location:{};
  return {message:String(d.msg??d.message??d.code??'Validation failed'),
   ...(typeof (location.line??d.line)==='number'?{line:location.line??d.line}:{}),
   ...(typeof (location.column??d.column)==='number'?{column:location.column??d.column}:{})};
 });
 return [...structuredClone(base),{role:'user',content:JSON.stringify({version:'ordinary-simple-feedback-v2',currentContract:candidate,errors,
  instruction:'Fix the reported errors in the current contract. Return the complete D/P/Q contract using the original output format.'})}];
}
export function conversationalRequest3(base:Message3[],candidate:Contract3,diagnostics:unknown[],history:{candidate:Contract3;diagnostics:unknown[]}[]){
 const current=ordinaryRequest3([],candidate,diagnostics)[0];
 return [...structuredClone(base),...history.map(h=>({role:'user',content:JSON.stringify({previousRepairProposal:h.candidate,validationErrors:JSON.parse(ordinaryRequest3([],h.candidate,h.diagnostics)[0].content).errors})})),
  {role:'user',content:JSON.stringify({...JSON.parse(current.content),version:'conversational-feedback-adapted-v1',instruction:'Use the previous repair attempts and their validation feedback to avoid repeating failures. Fix the current contract and return the complete D/P/Q in the original JSON format.'})}];
}
export async function ordinaryLoop3(options:{base:Message3[];initial:Contract3;initialDiagnostics:unknown[];maximum:number;consumed:number;
 strategy?:Strategy3;prepare?:(candidate:Contract3,diagnostics:unknown[],previous?:Contract3)=>{messages:Message3[];plan:unknown;blocked:boolean};
 audit?:(candidate:Contract3,plan:unknown)=>{passed:boolean;details:unknown;acceptanceBlocked?:boolean;feedbackDiagnostics?:unknown[]};
 transport:(messages:Message3[],attempt:number)=>Promise<unknown>;evaluate:(v:unknown)=>Promise<Evaluation3>;
 normalize:(v:unknown)=>{normalized:unknown;changes:unknown[]};identity:(c:Contract3)=>string;verify:()=>void;
 record:(attempt:number,event:unknown)=>void;request?:(attempt:number,messages:Message3[])=>void}){
 assert(Number.isInteger(options.maximum)&&options.maximum>=1&&options.maximum<=4);assert(Number.isInteger(options.consumed)&&options.consumed>=0&&options.consumed+options.maximum<=5);
 const strategy=options.strategy??'simple';if(strategy==='dependency-guided')assert(options.prepare&&options.audit);
 let candidate=structuredClone(options.initial),diagnostics=structuredClone(options.initialDiagnostics),stop='budget-exhausted',calls=0;
 const events:any[]=[],history:{candidate:Contract3;diagnostics:unknown[]}[]=[],seen=new Set([options.identity(candidate)]);let stagnant=0,previous:Contract3|undefined;
 const immutable=digest3({base:options.base,initial:options.initial,initialDiagnostics:options.initialDiagnostics});
 for(let attempt=1;attempt<=options.maximum;attempt++){
  options.verify();assert.equal(digest3({base:options.base,initial:options.initial,initialDiagnostics:options.initialDiagnostics}),immutable);
  const planned=strategy==='dependency-guided'?options.prepare!(candidate,diagnostics,previous):null;
  if(planned?.blocked){stop='unresolved-permission';const event={attempt,status:stop,permission:planned.plan};events.push(event);options.record(attempt,event);break;}
  const messages=planned?.messages??(strategy==='conversational'?conversationalRequest3(options.base,candidate,diagnostics,history):ordinaryRequest3(options.base,candidate,diagnostics));options.request?.(attempt,messages);calls++;
  let raw:unknown;
  try{raw=await options.transport(messages,attempt);}catch(e){stop='transport-or-response-stop';const event={attempt,status:stop,error:String(e),rawResponseStoredByTransport:true};events.push(event);options.record(attempt,event);break;}
  options.verify();
  const formatted=options.normalize(raw);let evaluation:Evaluation3;
  try{evaluation=await options.evaluate(formatted.normalized);}catch(e){stop='evaluation-infrastructure-stop';const event={attempt,status:stop,error:String(e),raw,formatChanges:formatted.changes};events.push(event);options.record(attempt,event);break;}
  if(!evaluation.publicProtocolValid){stop='protocol-rejected';const event={attempt,status:stop,raw,evaluation,formatChanges:formatted.changes};events.push(event);options.record(attempt,event);break;}
  const revised=(formatted.normalized as {contract:Contract3}).contract;assert(revised);
  const permission=strategy==='dependency-guided'?options.audit!(revised,planned!.plan):{passed:true,details:'not-applicable-unrestricted-baseline'};
  const identity=options.identity(revised),oldIdentity=options.identity(candidate),unchanged=identity===oldIdentity;
  stagnant=unchanged?stagnant+1:0;const cycle=!unchanged&&seen.has(identity);seen.add(identity);
  const changedClauses=(['definition','precondition','postcondition']as const).filter(k=>(candidate[k]??'')!==(revised[k]??''));
  const valid=evaluation.evaluation?.preExecValid===true;
  const event={attempt,status:'evaluated',previousCandidate:candidate,candidate:revised,evaluation,raw,formatChanges:formatted.changes,changedClauses,
   astChanged:!unchanged,permissionPassed:permission.passed,methodConstraintPassed:!permission.acceptanceBlocked,permissionAudit:permission.details,permissionPlan:planned?.plan??null,preExecValid:valid};
  events.push(event);options.record(attempt,event);
  if(!permission.passed){stop='permission-rejected';break;}
  previous=structuredClone(candidate);candidate=structuredClone(revised);diagnostics=structuredClone([...(evaluation.evaluation?.diagnostics??[]),...(permission.feedbackDiagnostics??[])]);history.push({candidate:structuredClone(revised),diagnostics:structuredClone(diagnostics)});
  if(valid&&!permission.acceptanceBlocked){stop='preexec-valid';break;}if(cycle){stop='candidate-cycle';break;}if(stagnant>=2){stop='two-unchanged-rounds';break;}
  if(!diagnostics.length){stop='no-actionable-validator-feedback';break;}
 }
 options.verify();return {version:'rq3-five-total-attempts-v3',strategy,candidate,stop,newLogicalCalls:calls,totalCallsIncludingInitial:options.consumed+calls,events,
  hiddenJestEvaluations:0,behavior:'not-evaluated',scope:strategy==='dependency-guided'?'Existing M3 permission and audit; common objective PreExec recorded independently':'Unrestricted D/P/Q edits; objective common PreExec; no M3 permission gate'};
}
