import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parse as dotenv} from 'dotenv';
import {prepareFullGuidedV2} from './lib/fullGuidedGenerationV2';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {normalizeRq1Output} from './lib/rq1OutputNormalization';
import {permissionAst,astStructureHash} from '../src/app/service/dependencyRepairAst';
import {reserved6,httpTransport6} from './lib/contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './lib/contractgenStage8';
import {digestFile} from './lib/rq1Batch114';
import {save,read,hash} from './lib/m4LiveAdapter';
import {ordinaryLoop3,ordinaryRequest3,digest3,type Contract3} from './rq3OrdinaryRepair';
import {conversationalRequest3,type Strategy3} from './rq3OrdinaryRepair';
import {planDependencyRepair,type PermissionInput,type RepairPermission} from '../src/app/service/dependencyRepairPermissions';
import {auditDependencyRepair} from '../src/app/service/dependencyRepairAudit';
import {localizeTypescriptDiagnostics} from '../src/app/service/typescriptOclLocalization';
import {repairPermissionInstruction} from '../src/app/service/repairPermissionInstruction';
import {rq3CurrentSourceFiles} from './rq3SourceRevision';

async function main(){
 const args=process.argv.slice(2),allowed=new Set(['--mode','--operation','--output','--preview','--execute-paid','--strategy']);
 for(let i=0;i<args.length;i++){assert(allowed.has(args[i]),`Unknown option ${args[i]}`);if(args[i]!=='--execute-paid'){assert(args[i+1]&&!args[i+1].startsWith('--'));i++;}}
 const get=(k:string,f='')=>args.includes(k)?args[args.indexOf(k)+1]:f;
 const mode=get('--mode','preview'),output=get('--output');assert(['preview','mock','run'].includes(mode));assert(output&&!fs.existsSync(output),'Fresh --output required');
 const strategy=get('--strategy','simple') as Strategy3;assert(['simple','conversational','dependency-guided'].includes(strategy));
 assert(mode==='run'||!args.includes('--execute-paid'),'Paid flag only valid in run mode');
 const seedRoot='results/rq3-narrative-repair-design-v1';
 for(const [p,h]of Object.entries(read(`${seedRoot}/manifest.json`).files))assert.equal(digestFile(p),h);
 const id=get('--operation'),seed=read(`${seedRoot}/natural-seeds.json`).find((s:any)=>s.operationId===id);assert(seed,'Select one frozen natural seed');
 assert.equal(digestFile(seed.sourceCandidate),seed.sourceCandidateSha256);
 const original=read(seed.sourceCandidate);assert.equal(original.firstGenerationOnly,true);assert.equal(original.repairCalls,0);
 const initial=original.candidate.contract as Contract3;assert(initial);
 const prepared=prepareFullGuidedV2(id),requestFile=`results/rq1-four-methods-114-v1/previews/${id}/full/request.json`;
 const frozen=read(requestFile);assert.deepEqual(prepared.request.messages,frozen.messages,'Current request differs from frozen Full V2');
 const initialEvaluation=await evaluateStage5Public(prepared.request.loaded.input,prepared.request.loaded.context,{contract:initial});
 assert(initialEvaluation.publicProtocolValid&&!initialEvaluation.evaluation?.preExecValid,'Seed is no longer a PreExec failure');
 const diagnostics=initialEvaluation.evaluation?.diagnostics??[];assert(diagnostics.length);
 const candidateKey=(c:Contract3)=>digest3({...c,definition:c.definition??''});
 const evaluations=new Map([[candidateKey(initial),initialEvaluation]]);
 const p=prepared.request.base.prepared;assert(p.enabled);
 const makePermission=(candidate:Contract3,errors:unknown[],previous?:Contract3)=>{
  const normalized={...candidate,definition:candidate.definition??''};
  const generated=evaluations.get(candidateKey(candidate))?.evaluation?.typescript?.entry;
  const localization=generated?localizeTypescriptDiagnostics(generated,normalized,prepared.request.loaded.context,errors as any):null;
  const input:PermissionInput={plan:p.compatibility.projection,context:prepared.request.loaded.context,pack:p.K.original.original,candidate:normalized,previous:previous?{...previous,definition:previous.definition??''}:undefined,validatorDiagnostics:(localization?.diagnostics??errors) as any};
  const permission=planDependencyRepair(input);const {beforeAst,alternatives,...directive}=permission;
  return {input,permission,localization,messages:[...frozen.messages,{role:'user',content:JSON.stringify({currentContract:candidate,validatorDiagnostics:input.validatorDiagnostics,dependencyRepairDirective:directive,instruction:repairPermissionInstruction(permission)+' Return the same public contract JSON, without taskEvidence or planHash.'})}]};
 };
 const initialPermission=strategy==='dependency-guided'?makePermission(initial,diagnostics):null;
 const initialMessages=initialPermission?.messages??(strategy==='conversational'?conversationalRequest3(frozen.messages,initial,diagnostics,[]):ordinaryRequest3(frozen.messages,initial,diagnostics));
 const files={...rq3CurrentSourceFiles()};
 for(const f of ['scripts/rq3OrdinaryRepair.ts','scripts/run_rq3_ordinary_repair.ts','src/app/service/typescriptOclLocalization.ts',seed.sourceCandidate,requestFile])files[f]=digestFile(f);
 const verify=()=>{for(const [p,h]of Object.entries(files))assert.equal(digestFile(p),h,`Frozen drift: ${p}`);};verify();
 const config=read('config/contractgen-stage8-pilot-v1.json');assert.equal(config.sampling.model,'gpt-5.5');
 const identity={version:'rq3-fallback-fix-v6',strategy,operationId:id,sourceCandidate:seed.sourceCandidate,sourceCandidateSha256:seed.sourceCandidateSha256,
  initial,diagnostics,baseMessagesHash:digest3(frozen.messages),firstRequestHash:digest3(initialMessages),config,maximumNewCalls:4,consumedInitial:1,permissionMode:strategy==='dependency-guided'?'existing-m3':'full-contract-unrestricted',hiddenFeedback:false,files};
 if(mode==='preview'){
  save(`${output}/identity.json`,identity);save(`${output}/request.json`,initialMessages);save(`${output}/initial-evaluation.json`,initialEvaluation);
  if(initialPermission)save(`${output}/initial-permission.json`,initialPermission.permission);
  if(initialPermission)save(`${output}/typescript-localization.json`,initialPermission.localization);
  save(`${output}/budget.json`,{maximumNewLogicalCalls:4,totalIncludingInitial:5,first:tokenReservation8(initialMessages,config),laterInputSize:'Recomputed before each call; history only in conversational arm'});
  console.log({preview:output,strategy,operationId:id,maximumNewCalls:4,realModelCalls:0,paidCalls:0});return;
 }
 let transport:any;const mock=mode==='mock';
 if(!mock){assert(args.includes('--execute-paid'),'Explicit --execute-paid required');const preview=get('--preview');assert(preview);assert.deepEqual(read(`${preview}/identity.json`),identity,'Preview/configuration drift');assert.deepEqual(read(`${preview}/request.json`),initialMessages);
  const env={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
  const endpoint=env.OPENAI_BASE_URL,key=env.OPENAI_API_KEY||env.API_KEY;assert(endpoint&&key,'Missing API configuration');const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
  transport=httpTransport6(endpoint,key,config.sampling,600000);
 }
 save(`${output}/identity.json`,identity);save(`${output}/run.json`,{slots:['repair__1','repair__2','repair__3','repair__4'],mock});
 const result=await ordinaryLoop3({base:frozen.messages,initial,initialDiagnostics:diagnostics,maximum:4,consumed:1,verify,strategy,
  prepare:(candidate,errors,previous)=>{const planned=makePermission(candidate,errors,previous);return {messages:planned.messages,plan:planned,blocked:planned.permission.mode==='unresolved'};},
  audit:(candidate,plan)=>{const planned=plan as ReturnType<typeof makePermission>;const audit=auditDependencyRepair(planned.permission,planned.input,{...candidate,definition:candidate.definition??''});return {passed:audit.permissionPassed,acceptanceBlocked:audit.blocked,feedbackDiagnostics:audit.crossClause.diagnostics,details:audit};},
  identity:c=>{const ast=permissionAst({...c,definition:c.definition??''},prepared.request.loaded.context);return ast.parsed?digest3(Object.values(ast.roots).map(astStructureHash)):digest3(c);},
  normalize:v=>normalizeRq1Output(v,'contract'),evaluate:async v=>{const evaluation=await evaluateStage5Public(prepared.request.loaded.input,prepared.request.loaded.context,v);if(evaluation.publicProtocolValid)evaluations.set(candidateKey((v as any).contract),evaluation);return evaluation;},
  record:(a,event)=>save(`${output}/events/${a}.json`,event),request:(a,m)=>save(`${output}/requests/${a}.json`,m),
  transport:async(messages,a)=>{
   if(mock){save(`${output}/mock-responses/${a}.json`,{contract:initial});return {contract:initial};}
   verify();const reservation=tokenReservation8(messages,config);save(`${output}/budget/${a}.json`,reservation);
   const v=await reserved6(output,`repair__${a}`,messages,hash(JSON.stringify(messages)),transport);
   const raw=read(`${output}/repair__${a}/raw-response.json`);assert(responseModelAccepted8(config,raw.raw?.body?.model));return v;
  }});
 save(`${output}/result.json`,result);save(`${output}/summary.json`,{operationId:id,method:strategy,mock,stop:result.stop,newLogicalCalls:result.newLogicalCalls,realModelCalls:mock?0:result.newLogicalCalls,paidCalls:mock?0:'See reservations and outcomes; unknown states may be billed',proposedPreExecValid:result.events.at(-1)?.preExecValid??false,methodAccepted:result.stop==='preexec-valid',hiddenJestEvaluations:0,behavior:'NOT_EVALUATED'});
 console.log({output,mock,stop:result.stop,calls:result.newLogicalCalls,realModelCalls:mock?0:result.newLogicalCalls});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
