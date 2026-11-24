import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse as dotenv} from 'dotenv';
import {prepareFullGuidedV2} from './lib/fullGuidedGenerationV2';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {repairControllerV2} from '../src/app/service/dependencyRepairPolicyV2';
import {permissionAst,astStructureHash} from '../src/app/service/dependencyRepairAst';
import {localizeTypescriptDiagnostics} from '../src/app/service/typescriptOclLocalization';
import {ordinaryLoop3,digest3,type Contract3,type Strategy3} from './rq3OrdinaryRepair';
import {permissionRetryLoopV2} from './rq3PermissionRetryLoop';
import {plainRepairBase,PLAIN_REPAIR_VERSION} from './lib/plainLlmRepair';
import {ordinaryRequest3,conversationalRequest3} from './rq3OrdinaryRepair';
import {selfRefineFeedbackRequest,selfRefineRevisionRequest,SELF_REFINE_REPAIR_VERSION} from './lib/selfRefineRepair';
import {configureExperimentProxy} from './lib/experimentProxy';
import {legacyUrllibTransport} from './lib/legacyUrllibTransport';
import {RepairInputBudgetError,compactJsonMessages} from './lib/repairRequestBudget';
import {normalizeRq1Output} from './lib/rq1OutputNormalization';
import {reserved6,httpTransport6,terminal6,seal6} from './lib/contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './lib/contractgenStage8';
import {evaluateContract} from '../src/app/service/evaluateContract';
import {rq3CurrentSourceFiles} from './rq3SourceRevision';
import {digestFile} from './lib/rq1Batch114';
import {save,read,hash} from './lib/m4LiveAdapter';

async function main(){
 const args=process.argv.slice(2),flags=new Set(['--execute-paid','--terminal-oracle']);
 const allowed=new Set([...flags,'--mode','--operation','--origin','--sample','--strategy','--output','--max-new-calls','--recover-source']);
 for(let i=0;i<args.length;i++){assert(allowed.has(args[i]),`Unknown option ${args[i]}`);if(!flags.has(args[i])){assert(args[i+1]&&!args[i+1].startsWith('--'));i++;}}
 const get=(k:string,f='')=>args.includes(k)?args[args.indexOf(k)+1]:f;
 const mode=get('--mode','preview'),requestedStrategy=get('--strategy','dependency-guided');
 const selfRefine=requestedStrategy==='self-refine',strategy=(selfRefine?'simple':requestedStrategy) as Strategy3;
 assert(['preview','mock','run'].includes(mode));assert(['simple','conversational','dependency-guided','self-refine'].includes(requestedStrategy));
 assert(!args.includes('--execute-paid')||mode==='run');if(mode==='run')assert(args.includes('--execute-paid'),'Explicit --execute-paid required');
 else globalThis.fetch=async()=>{throw Error('Offline mode forbids network');};
 const maximum=Number(get('--max-new-calls','4'));assert(Number.isInteger(maximum)&&maximum>=1&&maximum<=4);
 if(selfRefine)assert(maximum>=2,'Self-Refine needs feedback plus refinement: at least two calls');
 const output=get('--output');assert(output&&!fs.existsSync(output),'Fresh --output required; old paid slots are never replayed');
 const environment={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
 const network=mode==='run'?await configureExperimentProxy(environment):{source:'offline',modelRequests:0};
 const root='data/repair_validation_natural_v1',manifest=read(`${root}/manifest.json`),files={...rq3CurrentSourceFiles()};
 for(const [f,h]of Object.entries(manifest.files))files[`${root}/${f}`]=h as string;
 for(const f of [`${root}/manifest.json`,'scripts/run_rq3_repair_v2.ts','scripts/lib/repairRequestBudget.ts','scripts/lib/legacyUrllibTransport.ts','scripts/lib/urllib_model_transport.py','scripts/lib/experimentProxy.ts','package.json','package-lock.json','scripts/lib/selfRefineRepair.ts','scripts/lib/plainLlmRepair.ts','scripts/rq3OrdinaryRepair.ts','scripts/rq3PermissionRetryLoop.ts','src/app/service/dependencyRepairPolicyV2.ts','config/contractgen-stage8-pilot-v1.json'])files[f]=digestFile(f);
 const verify=()=>{for(const [f,h]of Object.entries(files))assert.equal(digestFile(f),h,`Frozen drift: ${f}`);};verify();
 const rows=fs.readFileSync(`${root}/generation/repair-inputs.jsonl`,'utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l));
 assert(get('--operation')||get('--sample'),'Choose --operation or --sample');
 const matches=rows.filter(r=>(!get('--sample')||r.sampleId===get('--sample'))&&(!get('--operation')||r.operationId===get('--operation'))&&(!get('--origin')||r.provenance.origins.some((o:any)=>o.method===get('--origin'))));
 assert.equal(matches.length,1,'Select exactly one seed; use --origin or --sample to disambiguate');const seed=matches[0];
 const prepared=prepareFullGuidedV2(seed.operationId),ctx=prepared.request.loaded.context,p=prepared.request.base.prepared;assert(p.enabled);
 assert.equal(prepared.request.loaded.input.narrativeRequirement,seed.requirement.description);assert.deepEqual(ctx,read(`${root}/generation/${seed.model.path}`));
 const base=strategy==='dependency-guided'?prepared.request.messages:plainRepairBase(prepared.request.base.common),initial=seed.initialContract as Contract3,key=(c:Contract3)=>digest3({definition:c.definition??'',precondition:c.precondition,postcondition:c.postcondition});
 const initialEvaluation=await evaluateStage5Public(prepared.request.loaded.input,ctx,{contract:initial});assert(initialEvaluation.publicProtocolValid&&!initialEvaluation.evaluation?.preExecValid);
 const errors=initialEvaluation.evaluation!.diagnostics;assert(errors.length);const evaluations=new Map([[key(initial),initialEvaluation]]);
 const controller=repairControllerV2(base,(candidate,diagnostics,previous)=>{
  const generated=evaluations.get(key(candidate))?.evaluation?.typescript?.entry;
  const localization=generated?localizeTypescriptDiagnostics(generated,candidate,ctx,diagnostics):null;
  return {plan:p.compatibility.projection,context:ctx,pack:p.K.original.original,candidate,previous,validatorDiagnostics:localization?.diagnostics??diagnostics};
 });
 const first=strategy==='dependency-guided'?controller.prepare({...initial,definition:initial.definition??''},errors):null;
 const firstMessages=first?.messages??(strategy==='conversational'?conversationalRequest3(base,initial,errors,[]):ordinaryRequest3(base,initial,errors));
 const inputPolicy=selfRefine?SELF_REFINE_REPAIR_VERSION:strategy==='dependency-guided'?'contractgen-dependency-guided-v2':PLAIN_REPAIR_VERSION;
 const config=read('config/contractgen-stage8-pilot-v1.json');assert.equal(config.sampling.model,'gpt-5.5');
 const recovery=get('--recover-source');let replayCalls=0;
 if(recovery){
  assert(!selfRefine&&strategy==='dependency-guided','Recovery currently supports dependency-guided budget blocks');
  const old=read(`${recovery}/identity.json`),result=read(`${recovery}/result.json`);
  assert.equal(old.sampleId,seed.sampleId);assert.equal(old.baseHash,digest3(base));assert.equal(old.initialHash,key(initial));assert.deepEqual(old.config,config);assert.equal(old.maximumNewCalls,maximum);
  assert(['input-budget-blocked','transport-or-response-stop'].includes(result.stop));assert(/Input limit exceeded|context budget exceeded|input budget/i.test(result.events.at(-1)?.error??''),'Only pre-call budget blocks may recover');
  for(let n=1;n<=maximum;n++)if(fs.existsSync(`${recovery}/repair__${n}/reservation.json`)){assert.equal(n,replayCalls+1);assert.equal(read(`${recovery}/repair__${n}/outcome.json`).status,'received');replayCalls++;}
  assert(replayCalls>0&&replayCalls<maximum);
  save(`${output}/recovery-source.json`,{source:path.resolve(recovery),replayedCalls:replayCalls,maximumNewNetworkCalls:maximum-replayCalls,oldResultSha256:digestFile(`${recovery}/result.json`)});
 }
 save(`${output}/identity.json`,{version:'rq3-repair-v2-live-v4',inputPolicy,permissionRejectionPolicy:strategy==='dependency-guided'?'bounded-retry-with-unchanged-baseline':'not-applicable',sampleId:seed.sampleId,operationId:seed.operationId,strategy:requestedStrategy,maximumNewCalls:maximum,totalMaximum:maximum+1,baseHash:digest3(base),initialHash:key(initial),config,files,hiddenFeedback:false});
 save(`${output}/initial-evaluation.json`,initialEvaluation);if(first)save(`${output}/initial-permission.json`,first.plan);
 save(`${output}/network-config.json`,network);
 if(mode==='preview'){const previewMessages=selfRefine?selfRefineFeedbackRequest(firstMessages):firstMessages;save(`${output}/request-v2.json`,previewMessages);save(`${output}/budget.json`,tokenReservation8(previewMessages,config));if(selfRefine)save(`${output}/refine-template.json`,{dependsOn:'Own actual feedback response only',exampleNotExecutable:selfRefineRevisionRequest(firstMessages,{feedback:'<actual feedback from preceding call>'}),maximumRounds:Math.floor(maximum/2),maximumLogicalCalls:maximum});console.log({mode,inputPolicy,sampleId:seed.sampleId,blocked:first?.blocked??false,realModelCalls:0,output});return;}
 save(`${output}/run.json`,{slots:Array.from({length:maximum},(_,i)=>`repair__${i+1}`),mock:mode==='mock',policy:'dependency-repair-policy-v2',maximumNewCalls:maximum,consumedInitial:1});
 let networkRequests=0;
 let transport:ReturnType<typeof httpTransport6>|undefined;
 if(mode==='mock')transport=async()=>({content:JSON.stringify({contract:structuredClone(initial)}),raw:{body:{model:'gpt-5.5'}},model:'gpt-5.5',inputTokens:null,outputTokens:null,reasoningTokens:null,finishReason:'stop'});
 if(mode==='run'){
  const env={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
  const endpoint=env.OPENAI_BASE_URL,secret=env.OPENAI_API_KEY||env.API_KEY;assert(endpoint&&secret,'Missing API URL/key');
  const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
  const rawProxy=environment.CONTRACTGEN_PROXY||environment.HTTPS_PROXY||environment.https_proxy||environment.HTTP_PROXY||environment.http_proxy||environment.ALL_PROXY||environment.all_proxy;
  const proxy=rawProxy==='direct'?null:rawProxy||('proxy'in network?network.proxy:null);
  transport=legacyUrllibTransport(endpoint,secret,config.sampling,proxy??null,environment.CONTRACTGEN_PYTHON||'python',600000);
  save(`${output}/transport-config.json`,{client:'python-urllib-legacy-v1',timeoutMs:600000,automaticRetries:0,proxySource:network.source});
 }
 let logicalSlots=0;const call=async(messages:{role:string;content:string}[],phase:string)=>{
   verify();assert(logicalSlots<maximum,'New-call budget exhausted');const n=logicalSlots+1;
   if(n>replayCalls)messages=compactJsonMessages(messages);
   let budget;try{budget=tokenReservation8(messages,config);}catch(e){throw new RepairInputBudgetError(`Repair input budget blocked before API call: ${String(e)}`);}
   logicalSlots=n;save(`${output}/budget/${n}.json`,budget);save(`${output}/phases/${n}.json`,{phase});
   if(n<=replayCalls){
    const source=`${recovery}/repair__${n}`;assert.deepEqual(read(`${source}/request.json`),messages,'Historical request changed; cannot replay paid response');
    fs.mkdirSync(`${output}/repair__${n}`,{recursive:true});for(const f of ['request.json','reservation.json','raw-response.json','outcome.json'])fs.copyFileSync(`${source}/${f}`,`${output}/repair__${n}/${f}`);
    return JSON.parse(read(`${source}/raw-response.json`).content);
   }
   const value=await reserved6(output,`repair__${n}`,messages,hash(JSON.stringify(messages)),async m=>{
    if(mode==='run'){networkRequests++;save(`${output}/network-attempts/${n}.json`,{attempt:n,startedAt:new Date().toISOString(),status:'invoked-may-be-billed'});}
    if(mode==='mock'&&phase==='feedback')return {content:JSON.stringify({feedback:'Mock: repair the reported validator error without inventing requirements.'}),raw:{body:{model:'gpt-5.5'}},model:'gpt-5.5',inputTokens:null,outputTokens:null,reasoningTokens:null,finishReason:'stop'};
    try{return await transport!(m);}catch(error){
     const causes:any[]=[];let current:any=error;const seen=new Set();
     while(current&&!seen.has(current)&&causes.length<8){seen.add(current);causes.push({name:current.name,code:current.code,message:String(current.message??current)});current=current.cause;}
     save(`${output}/network-errors/${n}.json`,{causes,network,retryAllowed:false,mayHaveConsumedFees:mode==='run'});throw error;
    }
   });
   const response=read(`${output}/repair__${n}/raw-response.json`);assert(responseModelAccepted8(config,response.raw?.body?.model),'Unexpected response model; raw response preserved');return value;
 };
 const result=await permissionRetryLoopV2({base,initial,initialDiagnostics:errors,maximum:selfRefine?Math.floor(maximum/2):maximum,consumed:1,strategy,verify,
  prepare:(c,d,prev)=>controller.prepare({...c,definition:c.definition??''},d,prev?{...prev,definition:prev.definition??''}:undefined),
  audit:(c,plan)=>controller.audit({...c,definition:c.definition??''},plan),
  identity:c=>{const ast=permissionAst({...c,definition:c.definition??''},ctx);return ast.parsed?digest3(Object.values(ast.roots).map(astStructureHash)):key(c);},
  normalize:v=>normalizeRq1Output(v,'contract'),evaluate:async v=>{const e=await evaluateStage5Public(prepared.request.loaded.input,ctx,v);if(e.publicProtocolValid)evaluations.set(key((v as any).contract),e);return e;},
  record:(n,e)=>save(`${output}/events/${n}.json`,e),request:(n,m)=>save(`${output}/requests/${n}.json`,m),
  transport:async(messages,n)=>{
   if(!selfRefine)return call(messages,'repair');
   const feedback=await call(selfRefineFeedbackRequest(messages),'feedback');
   const refinement=selfRefineRevisionRequest(messages,feedback);save(`${output}/self-feedback/${n}.json`,feedback);
   return call(refinement,'refine');
  }});
 const recordedResult={...result,strategy:requestedStrategy,candidateRounds:result.newLogicalCalls,newLogicalCalls:logicalSlots,totalCallsIncludingInitial:1+logicalSlots};
 save(`${output}/result.json`,recordedResult);
 const summary:any={policy:inputPolicy,sampleId:seed.sampleId,strategy:requestedStrategy,stop:result.stop,newLogicalCalls:logicalSlots,candidateRounds:result.newLogicalCalls,realModelCalls:networkRequests,replayedHistoricalCalls:replayCalls,totalRealCallsIncludingSource:networkRequests+replayCalls,mockTransportCalls:mode==='mock'?logicalSlots:0,methodAccepted:result.stop==='preexec-valid',proposedPreExecValid:result.events.at(-1)?.preExecValid??false,hiddenJestEvaluations:0,behavior:'NOT_EVALUATED',output};
 save(`${output}/generation-summary.json`,summary);
 if(mode==='run'&&args.includes('--terminal-oracle')){
  const event=result.events.at(-1);if(event?.preExecValid&&event.candidate){
   const c=event.candidate,common=event.evaluation;assert(common?.evaluation?.preExecValid);
   for(const slot of read(`${output}/run.json`).slots){
    if(!fs.existsSync(`${output}/${slot}`))save(`${output}/${slot}/skipped.json`,{reason:'Generation stopped before this budget slot',paidCall:false});
   }
   save(`${output}/terminal.candidate.json`,{contract:c,methodAccepted:summary.methodAccepted});seal6(output);
   const jc=require('jest-config'),original=jc.readInitialOptions;jc.readInitialOptions=async(...a:any[])=>{const r=await original(...a);return {...r,config:{...r.config,coverageDirectory:path.resolve(output,'coverage'),cacheDirectory:path.resolve(output,'cache'),modulePathIgnorePatterns:[...(r.config.modulePathIgnorePatterns??[]),'<rootDir>/results/','<rootDir>/tmp/']}};};
   try{const oracle:any=await terminal6(output,()=>evaluateContract({project:ctx.index.project,useCase:ctx.index.useCase,operation:ctx.index.operation.name,contract:common.evaluation!.contract,ocl:c,generatedSubsetValidation:true,oracleProfile:'rm2pt-authoritative-preparation-v4'} as any));save(`${output}/terminal-outcome.json`,oracle);summary.hiddenJestEvaluations=1;summary.behavior='See terminal-outcome.json';}
   catch(e){summary.behavior='EVALUATION_ERROR';save(`${output}/terminal-error.json`,{error:String(e)});}
  }
 }
 save(`${output}/summary.json`,summary);
 console.log(summary);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
