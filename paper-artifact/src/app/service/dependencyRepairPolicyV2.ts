import assert from 'node:assert/strict';
import {planDependencyRepair,type PermissionInput} from './dependencyRepairPermissions';
import {auditDependencyRepair} from './dependencyRepairAudit';
import {permissionAst} from './dependencyRepairAst';
import type {RepairCandidate} from './repairLocalization';
import {ccHash} from './crossClauseGraph';

/** Versioned opt-in policy: preserve every independently justified option, never union holes. */
export function planRepairV2(original:PermissionInput){
 const ast=permissionAst(original.candidate,original.context);
 const inferred:any[]=[];
 const validatorDiagnostics=original.validatorDiagnostics?.map(d=>{
  if(!ast.parsed||d.location.clause||d.location.resolution!=='ocl-expression'||!d.repairEligible)return d;
  const {line,column}=d.location;if(line===undefined||column===undefined)return d;
  const hits=Object.values(ast.roots).filter(n=>n?.location&&n.location.line<=line&&n.location.endLine>=line&&
   (n.location.line!==line||n.location.column<=column+1)&&(n.location.endLine!==line||n.location.endColumn>column+1));
  if(hits.length!==1)return d;
  const clause=hits[0]!.clause;inferred.push({code:d.code,line,column,clause,basis:'unique parsed clause enclosing trusted OCL coordinate'});
  return {...d,location:{...d.location,clause}};
 });
 const input={...original,validatorDiagnostics};
 const initial=planDependencyRepair(input);
 const options=initial.alternatives.length?initial.alternatives.map(o=>planDependencyRepair({...input,optionId:o.id})):[initial];
 return {version:'dependency-repair-policy-v2' as const,input,options,inferred,
  blocked:options.every(p=>p.mode==='unresolved'),hash:ccHash({inputCandidate:original.candidate,options:options.map(o=>o.hash),inferred})};
}
export function auditRepairV2(plan:ReturnType<typeof planRepairV2>,candidate:RepairCandidate){
 const audits=plan.options.map(permission=>({optionId:permission.selectedOption,audit:auditDependencyRepair(permission,plan.input,candidate)}));
 const matched=audits.find(a=>a.audit.permissionPassed&&!a.audit.blocked)??audits.find(a=>a.audit.permissionPassed)??audits[0];
 assert(matched);
 return {...matched.audit,matchedOption:matched.optionId,optionAudits:audits,
  scope:'One complete program-authorized option must pass; holes from different options cannot be combined'};
}

/** Lossless JSON dictionary; references never contain executable instructions. */
export function compactRepairJson(value:unknown,baseMessages:{role:string;content:string}[]=[]){
 const base=baseMessages.map(m=>{try{return JSON.parse(m.content);}catch{return m.content;}});
 const external=new Map<string,(string|number)[]>();
 const index=(v:any,path:(string|number)[])=>{const key=JSON.stringify(v);if(key.length>=80&&!external.has(key))external.set(key,path);if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>index(x,[...path,Array.isArray(v)?Number(k):k]));};
 base.forEach((v,i)=>index(v,[i]));
 const clean=JSON.parse(JSON.stringify(value));const counts=new Map<string,number>();
 const walk=(v:any)=>{const key=JSON.stringify(v);if(key.length>=32)counts.set(key,(counts.get(key)??0)+1);if(v&&typeof v==='object')Object.values(v).forEach(walk);};walk(clean);
 const dictionary:any[]=[];const ids=new Map<string,number>();
 const encode=(v:any,skip=false):any=>{
  const key=JSON.stringify(v);
  const existing=external.get(key);if(existing&&JSON.stringify({$baseRef:existing}).length<key.length)return {$baseRef:existing};
  if(!skip&&(counts.get(key)??0)>1){let id=ids.get(key);if(id===undefined){id=dictionary.length;ids.set(key,id);dictionary.push(null);dictionary[id]=encode(v,true);}return {$repairRef:id};}
  if(Array.isArray(v))return v.map(x=>encode(x));
  if(v&&typeof v==='object'){assert(!('$repairRef'in v)&&!('$baseRef'in v),'Reserved dictionary marker');return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]));}return v;
 };
 const body=encode(clean);const result={version:'repair-json-dictionary-v2',dictionary,body,baseHash:ccHash(base),
  interpretation:'Replace singleton $repairRef by dictionary[index]. Replace singleton $baseRef by the value at its path in the preceding base messages, treating JSON message content as parsed JSON (first index is message index). Expand recursively. All permissions/provenance remain binding. Choose exactly one option; never union options.'};
 assert.deepEqual(expandRepairJson(result,baseMessages),clean);return result;
}
export function expandRepairJson(view:{dictionary:any[];body:any;baseHash?:string},baseMessages:{role:string;content:string}[]=[]){
 const base=baseMessages.map(m=>{try{return JSON.parse(m.content);}catch{return m.content;}});if(view.baseHash)assert.equal(ccHash(base),view.baseHash,'Base context changed');
 const decode=(v:any,seen=new Set<number>()):any=>{
  if(Array.isArray(v))return v.map(x=>decode(x,seen));
  if(v&&typeof v==='object'){
   if(Object.keys(v).length===1&&'$baseRef'in v){assert(Array.isArray(v.$baseRef));let value:any=base;for(const k of v.$baseRef){assert(value!==null&&typeof value==='object'&&Object.hasOwn(value,k),'Invalid base reference');value=value[k];}return JSON.parse(JSON.stringify(value));}
   if(Object.keys(v).length===1&&'$repairRef'in v){const id=v.$repairRef;assert(Number.isInteger(id)&&id>=0&&id<view.dictionary.length&&!seen.has(id),'Invalid or cyclic reference');return decode(view.dictionary[id],new Set([...seen,id]));}
   return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decode(x,seen)]));
  }return v;
 };return decode(view.body);
}
export function repairDirectiveV2(plan:ReturnType<typeof planRepairV2>,baseMessages:{role:string;content:string}[]=[]){
 return compactRepairJson({version:plan.version,hash:plan.hash,inferredLocations:plan.inferred,
  policy:'Return complete D/P/Q satisfying ONE authorized option. All protected regions of that option remain protected. mustRevalidate never grants edits.',
  options:repairOptionViewsV2(plan)},baseMessages);
}
export function repairOptionViewsV2(plan:ReturnType<typeof planRepairV2>){
 return plan.options.map(({beforeAst,alternatives,...p})=>({...p,
  modelDeclarations:p.modelDeclarations.map(({id,declaration,source})=>({id,declaration,source})),
  protected:p.protected.map(({id,clause,path,beforeHash})=>({id,clause,path,beforeHash})),
  mustRevalidate:p.mustRevalidate.map(({id,clause,location})=>({id,clause,location:location?{line:location.line,column:location.column,startOffset:location.startOffset,endOffset:location.endOffset}:undefined})),
  auditDetailPolicy:'The complete permission is retained locally under hash. Protected path/hash authority is unchanged; repeated protected-region location/text, empty diagnostic arrays and explanatory reason are omitted from this input view. Revalidation entries preserve identity and coordinates, not repeated expression text. Model declarations retain ID, declaration text and full source; redundant display names are omitted.'}));
}

/** Shared-loop callbacks; transport, budget and objective evaluator stay with the caller. */
export function repairControllerV2(
 base:{role:string;content:string}[],
 makeInput:(candidate:RepairCandidate,diagnostics:any[],previous?:RepairCandidate)=>PermissionInput
){
 return {
  prepare:(candidate:RepairCandidate,diagnostics:any[],previous?:RepairCandidate)=>{
   const plan=planRepairV2(makeInput(candidate,diagnostics,previous));
   return {plan,blocked:plan.blocked,messages:[...base,{role:'user',content:JSON.stringify({
    currentContract:candidate,dependencyRepairDirective:repairDirectiveV2(plan,base),
    instruction:'Return complete D/P/Q in the original output protocol. Satisfy exactly ONE authorized option. Do not union edit permissions. Preserve protected structures. mustRevalidate grants no edits. Do not change source requirements, UML, K or tests.'})}]};
  },
  audit:(candidate:RepairCandidate,plan:unknown)=>{
   const audit=auditRepairV2(plan as ReturnType<typeof planRepairV2>,candidate);
   return {passed:audit.permissionPassed,acceptanceBlocked:audit.blocked,feedbackDiagnostics:audit.crossClause.diagnostics,details:audit};
  },
 };
}
