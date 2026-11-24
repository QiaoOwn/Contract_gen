import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parse as dotenv} from 'dotenv';
import {prepareFullGuidedV2} from './lib/fullGuidedGenerationV2';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {normalizeRq1Output} from './lib/rq1OutputNormalization';
import {reserved6,httpTransport6} from './lib/contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './lib/contractgenStage8';
import {read,save,hash} from './lib/m4LiveAdapter';
import {digestFile} from './lib/rq1Batch114';
import {ordinaryLoop3,ordinaryRequest3,conversationalRequest3,digest3,type Contract3,type Strategy3} from './rq3OrdinaryRepair';
import {permissionAst,astStructureHash} from '../src/app/service/dependencyRepairAst';
import {planDependencyRepair,type PermissionInput} from '../src/app/service/dependencyRepairPermissions';
import {auditDependencyRepair} from '../src/app/service/dependencyRepairAudit';
import {localizeTypescriptDiagnostics} from '../src/app/service/typescriptOclLocalization';
import {ccHash} from '../src/app/service/crossClauseGraph';
import {repairPermissionInstruction} from '../src/app/service/repairPermissionInstruction';
import {rq3CurrentSourceFiles} from './rq3SourceRevision';

async function main(){
 const args=process.argv.slice(2),allowed=new Set(['--mode','--seed','--strategy','--output','--preview','--execute-paid']);
 for(let i=0;i<args.length;i++){assert(allowed.has(args[i]),`Unknown option ${args[i]}`);if(args[i]!=='--execute-paid'){assert(args[i+1]&&!args[i+1].startsWith('--'));i++;}}
 const get=(k:string,f='')=>args.includes(k)?args[args.indexOf(k)+1]:f;
 const mode=get('--mode','preview'),output=get('--output'),strategy=get('--strategy','simple') as Strategy3;
 assert(['preview','mock','run'].includes(mode));assert(['simple','conversational','dependency-guided'].includes(strategy));assert(output&&!fs.existsSync(output),'Fresh output required');
 assert(mode==='run'||!args.includes('--execute-paid'));
 const seedRoot='results/rq3-controlled-seeds-v3',requestRoot='results/rq3-controlled-previews-v1';
 const files={...rq3CurrentSourceFiles(),...read(`${seedRoot}/manifest.json`).files,...read(`${requestRoot}/manifest.json`).files};
 for(const p of ['scripts/run_rq3_controlled_repair.ts','scripts/rq3OrdinaryRepair.ts','src/app/service/typescriptOclLocalization.ts'])files[p]=digestFile(p);
 const verify=()=>{for(const [p,h]of Object.entries(files))assert.equal(digestFile(p),h,`Frozen drift: ${p}`);};verify();
 const seed=read(`${seedRoot}/seeds.json`).find((s:any)=>s.seedId===get('--seed'));assert(seed&&seed.qualification==='qualified','Qualified frozen seed required');
 assert.equal(digestFile(seed.sourceCandidate),seed.sourceCandidateSha256);
 // The correct historical candidate is hash-checked, not loaded as a repair answer.
 const initial=structuredClone(seed.initialContract) as Contract3;assert.equal(ccHash(initial),seed.initialContractHash);
 const prepared=prepareFullGuidedV2(seed.operationId),p=prepared.request.base.prepared;assert(p.enabled);
 const frozenMessages=read(`${requestRoot}/${seed.seedId}/${strategy}/request.json`);
 assert.deepEqual(frozenMessages.slice(0,2),prepared.request.messages,'Controlled input differs from current Full V2');
 const initialEvaluation=await evaluateStage5Public(prepared.request.loaded.input,prepared.request.loaded.context,{contract:initial});
 assert(initialEvaluation.publicProtocolValid&&!initialEvaluation.evaluation?.preExecValid);
 const diagnostics=initialEvaluation.evaluation?.diagnostics??[];
 const key=(c:Contract3)=>digest3({...c,definition:c.definition??''}),cache=new Map([[key(initial),initialEvaluation]]);
 const makePermission=(candidate:Contract3,errors:unknown[],previous?:Contract3)=>{
  const normalized={...candidate,definition:candidate.definition??''},entry=cache.get(key(candidate))?.evaluation?.typescript?.entry;
  const trace=entry?localizeTypescriptDiagnostics(entry,normalized,prepared.request.loaded.context,errors as any):null;
  const input:PermissionInput={plan:p.compatibility.projection,context:prepared.request.loaded.context,pack:p.K.original.original,candidate:normalized,previous:previous?{...previous,definition:previous.definition??''}:undefined,validatorDiagnostics:(trace?.diagnostics??errors) as any};
  const permission=planDependencyRepair(input),{beforeAst,alternatives,...directive}=permission;
  return {input,permission,messages:[...prepared.request.messages,{role:'user',content:JSON.stringify({currentContract:candidate,validatorDiagnostics:input.validatorDiagnostics,dependencyRepairDirective:directive,instruction:repairPermissionInstruction(permission)+' Return the same public contract JSON, without taskEvidence or planHash.'})}]};
 };
 const first=strategy==='dependency-guided'?makePermission(initial,diagnostics).messages:strategy==='simple'?ordinaryRequest3(prepared.request.messages,initial,diagnostics):conversationalRequest3(prepared.request.messages,initial,diagnostics,[]);
 assert.deepEqual(first,frozenMessages,'First request differs from frozen controlled preview');
 const config=read('config/contractgen-stage8-pilot-v1.json');assert.equal(config.sampling.model,'gpt-5.5');
 const identity={version:'rq3-fallback-fix-v6',seedId:seed.seedId,operationId:seed.operationId,strategy,initial,sourceSeedHash:seed.initialContractHash,
  files,config,requestHash:digest3(first),baseRequestHash:prepared.requestHash,consumedInitial:1,maximumNewCalls:4,totalIncludingInitial:5,
  originalCorrectCandidateInRequest:false,oracleFeedback:false};
 if(mode==='preview'){save(`${output}/identity.json`,identity);save(`${output}/request.json`,first);save(`${output}/initial-evaluation.json`,initialEvaluation);if(strategy==='dependency-guided')save(`${output}/permission.json`,makePermission(initial,diagnostics).permission);save(`${output}/budget.json`,tokenReservation8(first,config));console.log({preview:output,seed:seed.seedId,strategy,realModelCalls:0,paidCalls:0});return;}
 const mock=mode==='mock';let transport:any;
 if(!mock){assert(args.includes('--execute-paid'),'Explicit paid flag required');const preview=get('--preview');assert(preview);assert.deepEqual(read(`${preview}/identity.json`),identity);assert.deepEqual(read(`${preview}/request.json`),first);
  const env={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
  const endpoint=env.OPENAI_BASE_URL,apiKey=env.OPENAI_API_KEY||env.API_KEY;assert(endpoint&&apiKey);const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
  transport=httpTransport6(endpoint,apiKey,config.sampling,600000);
 }
 save(`${output}/identity.json`,identity);save(`${output}/run.json`,{slots:['repair__1','repair__2','repair__3','repair__4'],mock});
 const result=await ordinaryLoop3({strategy,base:prepared.request.messages,initial,initialDiagnostics:diagnostics,maximum:4,consumed:1,verify,
  prepare:(candidate,errors,previous)=>{const q=makePermission(candidate,errors,previous);return {messages:q.messages,plan:q,blocked:q.permission.mode==='unresolved'};},
  audit:(candidate,plan)=>{const q=plan as ReturnType<typeof makePermission>,audit=auditDependencyRepair(q.permission,q.input,{...candidate,definition:candidate.definition??''});return {passed:audit.permissionPassed,acceptanceBlocked:audit.blocked,feedbackDiagnostics:audit.crossClause.diagnostics,details:audit};},
  normalize:v=>normalizeRq1Output(v,'contract'),identity:c=>{const ast=permissionAst({...c,definition:c.definition??''},prepared.request.loaded.context);return ast.parsed?digest3(Object.values(ast.roots).map(astStructureHash)):digest3(c);},
  evaluate:async v=>{const e=await evaluateStage5Public(prepared.request.loaded.input,prepared.request.loaded.context,v);if(e.publicProtocolValid)cache.set(key((v as any).contract),e);return e;},
  request:(a,m)=>{if(a===1)assert.deepEqual(m,first);save(`${output}/requests/${a}.json`,m);},record:(a,e)=>save(`${output}/events/${a}.json`,e),
  transport:async(messages,a)=>{if(mock){save(`${output}/mock-responses/${a}.json`,{contract:initial});return {contract:initial};}
   verify();save(`${output}/budget/${a}.json`,tokenReservation8(messages,config));const v=await reserved6(output,`repair__${a}`,messages,hash(JSON.stringify(messages)),transport);
   const raw=read(`${output}/repair__${a}/raw-response.json`);assert(responseModelAccepted8(config,raw.raw?.body?.model));return v;}});
 save(`${output}/result.json`,result);save(`${output}/summary.json`,{operationId:seed.operationId,seedId:seed.seedId,method:strategy,mock,stop:result.stop,newLogicalCalls:result.newLogicalCalls,realModelCalls:mock?0:result.newLogicalCalls,paidCalls:mock?0:'See reservations/outcomes',methodAccepted:result.stop==='preexec-valid',hiddenJestEvaluations:0,behavior:'NOT_EVALUATED'});
 console.log({seed:seed.seedId,strategy,mock,stop:result.stop,calls:result.newLogicalCalls,realModelCalls:mock?0:result.newLogicalCalls});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
