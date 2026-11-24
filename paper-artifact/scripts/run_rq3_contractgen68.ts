import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {narrativeDevelopmentProfile} from '../src/app/service/developmentBehavior/narrativeDevelopmentProfiles';
import {publicRunLocation,recoverPublicNetworkRun,recoverPublicBudgetRun} from './lib/publicDevelopmentRecovery';
import {rq3V3SourceFiles} from './rq3V3SourceRevision';

const args=process.argv.slice(2),flags=new Set(['--execute-paid','--direct','--resume-network','--accept-runner-fix','--accept-input-budget-fix']);
const allowed=new Set([...flags,'--mode','--output','--development-policy','--limit','--input-root']);
for(let i=0;i<args.length;i++){assert(allowed.has(args[i]),`Unknown option ${args[i]}`);if(!flags.has(args[i])){assert(args[i+1]&&!args[i+1].startsWith('--'));i++;}}
const get=(key:string,fallback:string)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const mode=get('--mode','prepare'),output=get('--output','results/rq3-contractgen68-current'),policy=get('--development-policy','require-all');
assert(['prepare','status','run','mock'].includes(mode));assert(['require-all','mapped-only'].includes(policy));
assert(!args.includes('--execute-paid')||mode==='run');assert(!args.includes('--resume-network')||mode==='run');
if(mode==='run')assert(args.includes('--execute-paid'),'Explicit paid execution required');
const inputRoot=get('--input-root','data/repair_validation_natural_v2');
const input=`${inputRoot}/generation/repair-inputs.jsonl`;
const read=(f:string)=>JSON.parse(fs.readFileSync(f,'utf8'));
const sha=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const rows=fs.readFileSync(input,'utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l));assert.equal(rows.length,68);assert.equal(new Set(rows.map(r=>r.sampleId)).size,68);
const samples=rows.map(r=>({sampleId:r.sampleId,operationId:r.operationId,
 behaviorAligned:!!narrativeDevelopmentProfile(r.operationId,r.requirement.description)}));
const repairManifest=read(`${inputRoot}/manifest.json`);
for(const [file,expected]of Object.entries(repairManifest.files))assert.equal(sha(`${inputRoot}/${file}`),expected,`Repair input integrity failed: ${file}`);
const behaviorFiles=Object.fromEntries(fs.readdirSync('src/app/service/developmentBehavior').filter(f=>f.endsWith('.ts')).map(f=>{
 const file=`src/app/service/developmentBehavior/${f}`;return [file,sha(file)];
}));
const plan={version:'rq3-contractgen68-v3-unified-v2',entry:'scripts/run_rq3_repair_v3.ts',inputRoot,policy,
 samples,initialGenerations:1,maximumNewCallsPerSeed:4,maximumNewCalls:272,
 inputSha256:sha(input),profileSha256:sha('config/narrative-development-profiles-v1.json'),
 profileExtensionsSha256:sha('config/narrative-development-profile-extensions-v1.json'),
 approvedProfilesSha256:sha('data/narrative_v4_114/public-profiles.json'),
 sourceFiles:{...rq3V3SourceFiles(),...behaviorFiles,...Object.fromEntries(['scripts/run_rq3_contractgen68.ts','scripts/run_rq3_repair_v3.ts','scripts/rq3PermissionRetryLoop.ts',
 'src/app/service/developmentBehavior/developmentRepairControllerV3.ts','src/app/service/developmentBehavior/developmentRepair.ts',
 'src/app/service/developmentBehavior/finiteScenarioReport.ts','src/app/service/developmentBehavior/loanRequestSelection.ts',
 'src/app/service/dependencyRepairPolicyV3.ts','src/app/service/developmentBehavior/obligationKinds.ts',
 'src/app/service/narrativeOperationInput.ts','scripts/lib/fullGuidedGenerationV2.ts','scripts/lib/rq1NarrativeComparisons.ts','scripts/development_behavior_worker.ts'].map(f=>[f,sha(f)]))},
 hiddenFeedback:false,priorPilotResultsImported:false};
if(!fs.existsSync(output)){
 assert(mode==='prepare','Prepare this independent batch before execution');fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'plan.json'),JSON.stringify(plan,null,2),{flag:'wx'});
}else {
 const frozen=read(path.join(output,'plan.json')),runner='scripts/run_rq3_contractgen68.ts';
 // Only batch orchestration may be acknowledged; every algorithm/input hash must still match.
 const budgetFiles=['scripts/lib/contractgenStage8.ts','config/contractgen-stage8-pilot-v1.json','scripts/lib/repairRequestBudget.ts','scripts/run_rq3_repair_v3.ts','scripts/run_rq3_repair_v2.ts','scripts/lib/publicDevelopmentRecovery.ts'];
 const budgetReceipt=path.join(output,'input-budget-fix.json');
 const budgetKeys=Object.keys({...frozen.sourceFiles,...plan.sourceFiles}).filter(f=>budgetFiles.includes(f.replaceAll('\\','/')));
 const changes=Object.fromEntries([runner,...budgetKeys].filter(f=>frozen.sourceFiles[f]!==plan.sourceFiles[f]).map(f=>[f,{before:frozen.sourceFiles[f]??null,after:(plan.sourceFiles as Record<string,string>)[f]??null}]));
 const ack={version:'input-budget-fix-v1',changes};
 const allowBudget=args.includes('--accept-input-budget-fix')||fs.existsSync(budgetReceipt);
 const comparable={...plan,sourceFiles:{...plan.sourceFiles,[runner]:frozen.sourceFiles[runner]} as Record<string,string>};
 if(allowBudget)for(const f of budgetKeys){if(f in frozen.sourceFiles)comparable.sourceFiles[f]=frozen.sourceFiles[f];else delete comparable.sourceFiles[f];}
 assert.deepEqual(frozen,comparable,
  'Batch inputs/configuration/algorithm source changed; use a fresh batch');
 if(allowBudget){
  if(fs.existsSync(budgetReceipt)){
   if(args.includes('--accept-input-budget-fix')&&JSON.stringify(read(budgetReceipt))!==JSON.stringify(ack)){
    fs.renameSync(budgetReceipt,budgetReceipt+'.'+Date.now()+'.previous');
    fs.writeFileSync(budgetReceipt,JSON.stringify(ack,null,2),{flag:'wx'});
   }else assert.deepEqual(read(budgetReceipt),ack,'Acknowledged budget fix changed again');
  }
  else fs.writeFileSync(budgetReceipt,JSON.stringify(ack,null,2),{flag:'wx'});
 }
 if(frozen.sourceFiles[runner]!==plan.sourceFiles[runner]){
  const receipt=path.join(output,`runner-fix-${plan.sourceFiles[runner]}.json`);
  const acknowledgement={runner,originalSha256:frozen.sourceFiles[runner],currentSha256:plan.sourceFiles[runner],
   reason:'Classify input-budget-blocked as an explicit terminal non-success; retain all prior evidence and skip it during continuation'};
  if(fs.existsSync(receipt))assert.deepEqual(read(receipt),acknowledgement);
  else {
   assert(allowBudget||args.includes('--accept-runner-fix'),'Batch runner changed only; use --accept-runner-fix to acknowledge the orchestration fix');
   fs.writeFileSync(receipt,JSON.stringify(acknowledgement,null,2),{flag:'wx'});
  }
 }
}
if(args.includes('--accept-input-budget-fix')){
 for(const sample of samples){
  const location=publicRunLocation(output,sample.sampleId),dir=location.directory;
  if(!fs.existsSync(path.join(dir,'summary.json')))continue;
  const summary=read(path.join(dir,'summary.json'));
  if(summary.stop!=='input-budget-blocked')continue;
  recoverPublicBudgetRun(output,sample.sampleId);
 }
}
const limit=Number(get('--limit','68'));assert(Number.isInteger(limit)&&limit>=1&&limit<=68);
const blockedStops=['transport-or-response-stop','evaluation-infrastructure-stop','development-infrastructure-stop'];
const checkpoint=()=>{
 const records:any[]=samples.map(sample=>{
  const location=publicRunLocation(output,sample.sampleId),dir=location.directory;
  if(!fs.existsSync(dir))return {...sample,status:'PENDING',calls:location.consumedCalls};
  if(!fs.existsSync(path.join(dir,'summary.json')))return {...sample,status:'INCOMPLETE',calls:location.consumedCalls,directory:dir};
  const summary=read(path.join(dir,'summary.json')),run=read(path.join(dir,'run.json'));
  const terminal=fs.existsSync(path.join(dir,'terminal-outcome.json'))?read(path.join(dir,'terminal-outcome.json')):null;
  return {...sample,status:blockedStops.includes(summary.stop)||summary.behavior==='EVALUATION_ERROR'?'BLOCKED':summary.stop==='input-budget-blocked'?'INPUT_BUDGET_BLOCKED':run.mock?'MOCK_COMPLETED':'COMPLETED',
   accepted:summary.methodAccepted,preExec:summary.proposedPreExecValid,oracle:terminal?.test_execution_ok??null,
   stop:summary.stop,error:fs.existsSync(path.join(dir,'result.json'))?read(path.join(dir,'result.json')).events?.at(-1)?.error??null:null,
   calls:location.consumedCalls+summary.realModelCalls,directory:dir};
 });
 const count=(s:string)=>records.filter(r=>r.status===s).length;
 return {records,total:68,completed:count('COMPLETED'),mockCompleted:count('MOCK_COMPLETED'),pending:count('PENDING'),
  blocked:count('BLOCKED')+count('INCOMPLETE'),inputBudgetBlocked:count('INPUT_BUDGET_BLOCKED'),terminal:count('COMPLETED')+count('INPUT_BUDGET_BLOCKED'),acceptedOraclePasses:records.filter(r=>r.status==='COMPLETED'&&r.accepted&&r.oracle===true).length,
  realCalls:records.reduce((n,r)=>n+(r.calls??0),0),publicBehaviorCovered:samples.filter(s=>s.behaviorAligned).length,
  coverageGaps:samples.filter(s=>!s.behaviorAligned),maximumNewCalls:272};
};
if(mode==='run'||mode==='mock'){
 const gaps=samples.filter(s=>!s.behaviorAligned);
 assert(policy!=='require-all'||!gaps.length,`${gaps.length}/68 seeds lack aligned public behavior; no model call was made. See plan.json. No silent fallback.`);
 const kind=path.join(output,'execution-kind.json');
 if(fs.existsSync(kind))assert.equal(read(kind).mode,mode,'Mock and paid runs cannot share directories');
 else fs.writeFileSync(kind,JSON.stringify({mode}),{flag:'wx'});
 for(const [i,sample]of samples.slice(0,limit).entries()){
  let location=publicRunLocation(output,sample.sampleId),state=checkpoint().records.find(r=>r.sampleId===sample.sampleId)!;
  if(state.status===(mode==='mock'?'MOCK_COMPLETED':'COMPLETED')||state.status==='INPUT_BUDGET_BLOCKED'){console.log(`SKIP [${i+1}/68] ${sample.operationId} (${state.status})`);continue;}
  if(state.status==='BLOCKED'&&state.stop==='transport-or-response-stop'&&args.includes('--resume-network')){
   try{location=recoverPublicNetworkRun(output,sample.sampleId);state=checkpoint().records.find(r=>r.sampleId===sample.sampleId)!;}
   catch(error){console.warn(`DEFER [${i+1}/68] ${sample.operationId}: ${String(error)}; original stop: ${state.error??state.stop}`);continue;}
  }
  if(state.status==='INCOMPLETE'||(state.status==='BLOCKED'&&state.stop==='transport-or-response-stop')){
   console.warn(`DEFER [${i+1}/68] ${sample.operationId}: ${state.error??state.stop??'Incomplete run; may still be active'}. Evidence retained: ${location.directory}`);continue;
  }
  assert.equal(state.status,'PENDING',`Validation/environment stop: ${state.stop}; ${state.error??''}; ${location.directory}`);
  const replay=location.entries.at(-1),maximum=4-location.consumedCalls+(replay?.replayCount??0);assert(maximum>=1);
  const child:string[]=['--import','tsx','scripts/run_rq3_repair_v3.ts','--mode',mode,'--sample',sample.sampleId,'--max-new-calls',String(maximum),'--output',location.directory];
  child.push('--input-root',inputRoot);
  if(sample.behaviorAligned)child.push('--development-behavior','--joint-target-repair');
  if(replay?.replayCount)child.push('--network-replay-source',replay.replaySource!);
  if(mode==='run')child.push('--execute-paid','--terminal-oracle');
  console.log(`[${i+1}/68] ${sample.operationId}; public behavior: ${sample.behaviorAligned?'enabled':'NOT COVERED (explicit mapped-only policy)'}`);
  const result:ReturnType<typeof spawnSync>=spawnSync(process.execPath,child,{cwd:process.cwd(),stdio:'inherit',windowsHide:true,
   env:args.includes('--direct')?{...process.env,CONTRACTGEN_PROXY:'direct'}:process.env});
  fs.writeFileSync(path.join(output,'checkpoint.json'),JSON.stringify(checkpoint(),null,2));
  const after=checkpoint().records.find(r=>r.sampleId===sample.sampleId)!;
  if(after.status==='INCOMPLETE'||(after.status==='BLOCKED'&&after.stop==='transport-or-response-stop')){
   console.warn(`DEFER [${i+1}/68] ${sample.operationId}: ${after.error??result.error??'Child interrupted before summary'}; exit=${result.status}. Continue other seeds; no automatic retry.`);continue;
  }
  assert.equal(result.status,0,`Child interrupted; preserved evidence: ${location.directory}`);
  if(after.status==='BLOCKED')throw Error(`Validation/environment stop: ${after.stop}; ${after.error??''}; inspect ${location.directory}`);
 }
}
const state=checkpoint();fs.writeFileSync(path.join(output,'checkpoint.json'),JSON.stringify(state,null,2));
console.log(JSON.stringify({...state,records:undefined,coverageGaps:state.coverageGaps.length,paidCallsInitiatedByPreparation:0,output},null,2));
