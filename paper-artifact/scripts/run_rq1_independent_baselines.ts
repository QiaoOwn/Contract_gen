import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {parse as dotenv} from 'dotenv';
import {independentBaselineMethods,independentBaselineRequest,independentBaselineVersion,type IndependentBaselineMethod} from './rq1IndependentBaselineRequests';
import {verifyPreparedBatch,loadBatchOperations,digestFile,readBatchJson,validateCompletedRun} from './lib/rq1Batch114';
import {hash,save} from './lib/m4LiveAdapter';
import {reserved6,httpTransport6} from './lib/contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './lib/contractgenStage8';
import {rq1Generate,Rq1OutputProtocolError} from './lib/rq1NarrativeComparisons';
import {durableWrite,checkpoint,flushEvidence,showDurableStatus,durableStatus} from './rq1DurableProgress';
import {networkFailure,archiveNetworkFailure,waitForNetworkRetry,runWithNetworkRetries,networkRetryRecords} from './rq1NetworkRetry';
import {pathOclNlpFile} from './rq1PathOclContext';

const ownFiles=['scripts/run_rq1_independent_baselines.ts','scripts/rq1IndependentBaselineRequests.ts',
 'scripts/rq1DurableProgress.ts','scripts/rq1NetworkRetry.ts','scripts/rq1PathOclContext.ts','scripts/prepare_pathocl_nlp.py',
 'scripts/pathocl-nlp-requirements.txt',pathOclNlpFile];
function verify(root:string){
 const plan=readBatchJson(`${root}/selection.json`);assert.equal(plan.version,independentBaselineVersion);
 verifyPreparedBatch(plan.parentRoot);
 for(const [file,digest]of Object.entries(plan.files))assert.equal(digestFile(file),digest,`Baseline drift: ${file}`);
 assert.deepEqual(plan.operations,loadBatchOperations());return plan;
}
function verifyPreview(root:string,id:string,method:IndependentBaselineMethod){
 const preview=`${root}/previews/${id}/${method}`,identity=readBatchJson(`${preview}/identity.json`);
 assert.equal(identity.version,independentBaselineVersion);assert.equal(identity.operationId,id);assert.equal(identity.method,method);
 assert.equal(digestFile(`${preview}/request.json`),identity.requestFileHash);
 const request=independentBaselineRequest(id,method).request;assert.equal(request.hash,identity.requestHash);
 assert.deepEqual(readBatchJson(`${preview}/request.json`).messages,request.messages);return {identity,request};
}
async function generate(root:string,id:string,method:IndependentBaselineMethod){
 const plan=verify(root),{identity,request}=verifyPreview(root,id,method),out=`${root}/runs/${id}/${method}`;
 assert(!fs.existsSync(out),'Fresh generation directory required');
 const env={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
 const endpoint=env.OPENAI_BASE_URL,key=env.OPENAI_API_KEY||env.API_KEY;assert(endpoint&&key,'Missing API config');
 const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
 const slot=`${method}__1`,reservation=tokenReservation8(request.messages,plan.config);
 durableWrite(`${out}/run.json`,{preview:`${root}/previews/${id}/${method}`,identityHash:hash(JSON.stringify(identity)),
  config:plan.config,slots:[slot],mock:false});
 durableWrite(`${out}/budget/${slot}.json`,{slot,...reservation,refundable:false});
 let calls=0,stopReason:string|null=null,status='UNKNOWN';
 try{
  const result=await rq1Generate(request,async messages=>{
   assert.equal(++calls,1);verify(root);verifyPreview(root,id,method);
   const value=await reserved6(out,slot,messages,hash(JSON.stringify(messages)),httpTransport6(endpoint,key,plan.config.sampling,600000));
   const response=readBatchJson(`${out}/${slot}/raw-response.json`);
   assert(responseModelAccepted8(plan.config,response.raw?.body?.model),'Unexpected model');
   assert(response.inputTokens==null||response.inputTokens<=reservation.inputTokensReserved);
   assert(response.outputTokens==null||response.outputTokens<=reservation.outputTokensReserved);
   return value;
  });save(`${out}/${method}.candidate.json`,result);status='CANDIDATE_RECEIVED';
 }catch(error){
  stopReason=String(error);const file=`${out}/${slot}/outcome.json`;
  if(error instanceof Rq1OutputProtocolError||fs.existsSync(file)&&readBatchJson(file).status==='protocol-invalid'){status='PROTOCOL_ERROR';stopReason=null;}
  else if(fs.existsSync(`${out}/${slot}/raw-response.json`))status='GENERATION_ERROR';
 }
 const entries:Record<string,string>={};const walk=(dir:string)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else entries[file]=digestFile(file);
 }};walk(out);save(`${out}/generation-seal.json`,{entries,feedbackAllowed:false,interrupted:stopReason!==null});
 save(`${out}/summary.json`,{operationId:id,results:[{method,status,calls}],stopReason,realModelCalls:calls,hiddenJestEvaluations:0});
 flushEvidence(out);console.log({operationId:id,method,status,stopReason});if(stopReason)throw Error(stopReason);
}
async function main(){
 const args=process.argv.slice(2),options=new Map<string,string>();let paid=false;
 for(let n=0;n<args.length;n++){
  if(args[n]==='--execute-paid'){assert(!paid);paid=true;continue;}
  assert(['--mode','--root','--parent-root','--method','--operation'].includes(args[n]),'Unknown option');
  assert(!options.has(args[n])&&args[n+1]&&!args[n+1].startsWith('--'),'Missing or duplicate option');options.set(args[n],args[++n]);
 }
 const root=options.get('--root')??'results/rq1-independent-baselines-114-v2',mode=options.get('--mode')??'prepare';
 assert(['prepare','run','status','single'].includes(mode));assert(['run','single'].includes(mode)||!paid);
 if(mode==='prepare'){
  const parentRoot=options.get('--parent-root')??'results/rq1-four-methods-114-v1';const parent=verifyPreparedBatch(parentRoot);
  if(!fs.existsSync(root))durableWrite(`${root}/selection.json`,{version:independentBaselineVersion,parentRoot,
   operations:parent.operations,methods:[...independentBaselineMethods],config:readBatchJson('config/contractgen-stage8-pilot-v1.json'),
   maximumCandidateCalls:228,formalExperimentReady:false,files:Object.fromEntries([...ownFiles,`${parentRoot}/selection.json`].map(f=>[f,digestFile(f)]))});
  const plan=verify(root);
  for(const [index,id]of plan.operations.entries())for(const method of independentBaselineMethods){
   const preview=`${root}/previews/${id}/${method}`;
   if(!fs.existsSync(preview)){
    const p=independentBaselineRequest(id,method);tokenReservation8(p.request.messages,plan.config);
    durableWrite(`${preview}/request.json`,{messages:p.request.messages,requestHash:p.request.hash});
    durableWrite(`${preview}/identity.json`,{version:p.version,operationId:id,method,config:plan.config,
     requestHash:p.request.hash,requestFileHash:digestFile(`${preview}/request.json`),adaptation:p.adaptation,excluded:p.excluded,
     pathAudit:p.pathAudit,maximumCalls:1});
   }verifyPreview(root,id,method);
   if(method==='pathocl-style'&&(index+1)%10===0)console.log(`Prepared ${index+1}/114 pairs`);
  }
  verify(root);durableWrite(`${root}/prepared-${Date.now()}.json`,{requests:228,realModelCalls:0});console.log({requests:228,realModelCalls:0});return;
 }
 const method=options.get('--method') as IndependentBaselineMethod;assert(independentBaselineMethods.includes(method));
 if(mode==='status'){console.log(JSON.stringify({...showDurableStatus(root,method),technicalRetries:networkRetryRecords(root,method)},null,2));return;}
 assert(paid,'Explicit --execute-paid required');const plan=verify(root);
 if(mode==='single'){
  const id=options.get('--operation');assert(id&&plan.operations.includes(id));await generate(root,id,method);return;
 }
 const folder=`${root}/progress/${method}`,lock=`${folder}/runner.lock`;fs.mkdirSync(folder,{recursive:true});
 if(fs.existsSync(lock)){
  const p=readBatchJson(lock);try{process.kill(p.pid,0);throw Error('Method already running');}
  catch(e){if((e as NodeJS.ErrnoException).code!=='ESRCH')throw e;}
  fs.renameSync(lock,`${lock}.stale-${Date.now()}`);
 }durableWrite(lock,{pid:process.pid});
 const command=(argv:string[])=>{const child=spawnSync(process.execPath,argv,{stdio:'inherit',env:process.env});if(child.error)throw child.error;return child.status;};
 try{
  networkRetryRecords(root,method);
  for(const id of plan.operations){
   verifyPreview(root,id,method);
   if(networkFailure(root,id,method)){const r=archiveNetworkFailure(root,id,method);waitForNetworkRetry(r.delayMs);}
   const run=`${root}/runs/${id}/${method}`;if(fs.existsSync(run))validateCompletedRun(run,id,method);
  }
  for(const [index,id]of plan.operations.entries()){
   console.log(`[${index+1}/114] ${method}: ${id}`);
   const run=`${root}/runs/${id}/${method}`,oracle=`${root}/oracle/${id}/${method}`;
   if(!fs.existsSync(run))runWithNetworkRetries(root,id,method,()=>{
    checkpoint(root,method,'GENERATION_STARTED',{operationId:id});
    const code=command(['--import','tsx','scripts/run_rq1_independent_baselines.ts','--mode','single','--root',root,'--method',method,'--operation',id,'--execute-paid']);
    checkpoint(root,method,'GENERATION_RETURNED',{operationId:id,exitCode:code});return code;
   });
   validateCompletedRun(run,id,method);
   if(!fs.existsSync(oracle)){
    checkpoint(root,method,'ORACLE_STARTED',{operationId:id});
    assert.equal(command(['--import','tsx','scripts/run_rq1_six_oracle_offline.cjs',run,oracle]),0,'Oracle interrupted; do not regenerate');
    flushEvidence(oracle);
   }
   const o=readBatchJson(`${oracle}/summary.json`);assert.equal(o.operationId,id);assert.equal(o.source,run);
   assert.equal(o.newModelCalls,0);checkpoint(root,method,'OPERATION_COMPLETED',{operationId:id,status:showDurableStatus(root,method)});
  }
 }catch(error){checkpoint(root,method,'RUN_STOPPED',{error:String(error),status:durableStatus(root,method)});throw error;}
 finally{fs.unlinkSync(lock);}
}
main().catch(error=>{console.error(String(error));process.exitCode=1;});
