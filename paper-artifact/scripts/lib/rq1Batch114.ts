import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const batchMethods = ['direct','full','codexprompt-style','pathocl-style'] as const;
export type BatchMethod = typeof batchMethods[number];
export const batchInput = 'data/narrative_v3_114/generation/requirements.jsonl';
export const batchConfig = 'config/contractgen-stage8-pilot-v1.json';
export const readBatchJson = (file:string):any => JSON.parse(fs.readFileSync(file,'utf8'));
export const digestFile = (file:string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save = (file:string,value:unknown) => {
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2));fs.renameSync(temp,file);
};
export type BatchCommand = (args:string[])=>void;

export function loadBatchOperations(){
 const rows=fs.readFileSync(batchInput,'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
 const ids=rows.map(row=>row.operationId as string);
 assert.equal(ids.length,114);assert.equal(new Set(ids).size,114);
 assert(ids.every(id=>/^[A-Za-z0-9_]+$/.test(id)));
 return ids;
}
export function batchEntry(method:BatchMethod){
 assert(batchMethods.includes(method));
 return method==='full'?'scripts/run_full_guided_v2.ts':'scripts/run_rq1_six_method_smoke.ts';
}
function protectedFiles(){
 const walk=(dir:string):string[]=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const file=path.join(dir,e.name);return e.isDirectory()?walk(file):/\.(ts|json|jsonl|g4|txt|cjs)$/.test(e.name)?[file]:[];
 });
 return [...new Set([
  ...['src','antlr4','public','scripts/lib','test/helpers','data/narrative_v3_114/generation'].flatMap(walk),
  batchConfig,'scripts/run_rq1_batch114.ts','scripts/run_full_guided_v2.ts',
  'scripts/run_rq1_six_method_smoke.ts','scripts/evaluate_rq1_six_smoke.ts','scripts/run_rq1_six_oracle_offline.cjs',
  'data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json',
  ...readBatchJson('data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json').records.map((r:any)=>r.historical_jest),
 ])];
}
export function verifyBatch(root:string){
 const plan=readBatchJson(`${root}/selection.json`);
 assert.equal(plan.version,'rq1-four-methods-114-v1');
 assert.deepEqual(plan.operations,loadBatchOperations());assert.deepEqual(plan.methods,[...batchMethods]);
 assert.equal(plan.maximumLogicalCalls,456);
 for(const [file,hash] of Object.entries(plan.files))assert.equal(digestFile(file),hash,`Frozen drift: ${file}`);
 return plan;
}
export function verifyBatchPreview(root:string,id:string,method:BatchMethod){
 const preview=`${root}/previews/${id}/${method}`,identity=readBatchJson(`${preview}/identity.json`);
 assert.equal(identity.operationId,id);assert.equal(identity.sourceRevision??null,null);
 assert.deepEqual(identity.config,readBatchJson(batchConfig));
 assert.equal(identity.config.sampling.model,'gpt-5.5');assert.equal(identity.oracleFeedback??identity.hiddenFeedback,false);
 if(method==='full'){
  assert.equal(identity.generationRevision,'full-guided-generation-v2');assert.equal(identity.method,'full');
  assert.equal(identity.maximumCalls,1);
 }else{
  assert.deepEqual(identity.methods,[method]);assert.deepEqual(identity.slots,[`${method}__1`]);
  assert.equal(identity.promptVersions[method],method==='direct'?'direct-llm-v3':'rq1-rule-guided-v3');
 }
 for(const [file,hash] of Object.entries(identity.files))assert.equal(digestFile(file),hash,`Preview drift: ${file}`);
 return identity;
}
export function prepareBatch114(root:string,command:BatchCommand){
 if(!fs.existsSync(root)){
  const config=readBatchJson(batchConfig);assert.equal(config.sampling.model,'gpt-5.5');
  assert.equal(config.repair,false);assert.equal(config.hiddenFeedback,false);
  save(`${root}/selection.json`,{version:'rq1-four-methods-114-v1',operations:loadBatchOperations(),methods:[...batchMethods],
   input:batchInput,model:'gpt-5.5',fullGenerationRevision:'full-guided-generation-v2',directPromptVersion:'direct-llm-v3',
   maximumLogicalCalls:456,maximumLogicalCallsPerMethod:114,callsPerOperation:1,repair:false,hiddenFeedback:false,
   oracleProfile:config.oracleProfile,formalExperimentReady:false,
   files:Object.fromEntries(protectedFiles().map(file=>[file,digestFile(file)]))});
 }
 const plan=verifyBatch(root);let count=0;
 for(const id of plan.operations)for(const method of batchMethods){
  const preview=`${root}/previews/${id}/${method}`;
  if(!fs.existsSync(preview))command(['--import','tsx',batchEntry(method),'--operation',id,
   ...(method==='full'?[]:['--methods',method]),'--output',preview]);
  verifyBatchPreview(root,id,method);count++;
  if(count%20===0)console.log(`Prepared ${count}/456 requests`);
 }
 verifyBatch(root);
 save(`${root}/prepared.json`,{version:plan.version,selectionSha256:digestFile(`${root}/selection.json`),
  identities:Object.fromEntries(plan.operations.flatMap((id:string)=>batchMethods.map(method=>{
   const file=`${root}/previews/${id}/${method}/identity.json`;return [file,digestFile(file)];
  }))),requests:count,maximumLogicalCalls:456,realModelCalls:0});
 return {requests:count,realModelCalls:0};
}
export function verifyPreparedBatch(root:string){
 const plan=verifyBatch(root),prepared=readBatchJson(`${root}/prepared.json`);
 assert.equal(prepared.selectionSha256,digestFile(`${root}/selection.json`));
 assert.equal(Object.keys(prepared.identities).length,456);
 for(const [file,hash] of Object.entries(prepared.identities))assert.equal(digestFile(file),hash,`Identity drift: ${file}`);
 return plan;
}
export function validateCompletedRun(dir:string,id:string,method:BatchMethod){
 const summary=readBatchJson(`${dir}/summary.json`);
 assert.equal(summary.operationId,id);assert.equal(summary.stopReason,null,'Stopped/unknown call; inspect evidence. No automatic retry.');
 assert.equal(summary.realModelCalls,1);assert.equal(summary.hiddenJestEvaluations,0);
 const result=summary.results.find((r:any)=>r.method===method);assert(result&&result.calls===1);
 assert(['CANDIDATE_RECEIVED','PROTOCOL_ERROR'].includes(result.status),'Incomplete or uncertain generation');
 if(method==='full')assert.equal(summary.generationRevision,'full-guided-generation-v2');
 const seal=readBatchJson(`${dir}/generation-seal.json`);assert.equal(seal.feedbackAllowed,false);
 for(const [file,hash] of Object.entries(seal.entries))assert.equal(digestFile(file),hash,`Generation drift: ${file}`);
 return summary;
}
function validateOracle(oracle:string,run:string,id:string,method:BatchMethod){
 const evaluation=readBatchJson(`${oracle}/summary.json`);
 assert.equal(evaluation.operationId,id);assert.equal(evaluation.source,run);
 assert.equal(evaluation.newModelCalls,0);assert.equal(evaluation.generationEvidenceUnchanged,true);
 assert(evaluation.results.some((r:any)=>r.method===method));
}
export function runBatch114(root:string,method:BatchMethod,command:BatchCommand,executePaid=false){
 assert(executePaid,'Explicit --execute-paid required');assert(batchMethods.includes(method));
 const plan=verifyPreparedBatch(root);
 // Validate the entire selected arm before spending on its first operation.
 for(const id of plan.operations){
  verifyBatchPreview(root,id,method);
  const run=`${root}/runs/${id}/${method}`;
  if(fs.existsSync(run))validateCompletedRun(run,id,method);
  const oracle=`${root}/oracle/${id}/${method}`;
  if(fs.existsSync(oracle)){
   assert(fs.existsSync(run),'Oracle without a source generation');validateOracle(oracle,run,id,method);
  }
 }
 let generated=0;
 for(const [index,id] of plan.operations.entries()){
  console.log(`[${index+1}/114] ${method}: ${id}`);
  const preview=`${root}/previews/${id}/${method}`,run=`${root}/runs/${id}/${method}`,oracle=`${root}/oracle/${id}/${method}`;
  if(!fs.existsSync(run)){
   verifyBatch(root);verifyBatchPreview(root,id,method);
   command(['--import','tsx',batchEntry(method),'--preview',preview,'--output',run,'--execute-paid']);generated++;
  }
  validateCompletedRun(run,id,method);
  if(!fs.existsSync(oracle))command(['--import','tsx','scripts/run_rq1_six_oracle_offline.cjs',run,oracle]);
  validateOracle(oracle,run,id,method);
 }
 verifyBatch(root);
 return {method,operations:114,newGenerationRuns:generated,maximumCalls:114};
}
export function summarizeBatch114(root:string){
 const plan=readBatchJson(`${root}/selection.json`);
 const rows=plan.operations.map((id:string)=>({id,methods:Object.fromEntries(batchMethods.map(method=>{
  const dir=`${root}/runs/${id}/${method}`,runFile=`${dir}/summary.json`,oracleFile=`${root}/oracle/${id}/${method}/summary.json`;
  const run=fs.existsSync(runFile)?readBatchJson(runFile):null;
  const oracle=fs.existsSync(oracleFile)?readBatchJson(oracleFile).results.find((r:any)=>r.method===method):null;
  const outcomeFile=`${dir}/${method}__1/outcome.json`,usage=fs.existsSync(outcomeFile)?readBatchJson(outcomeFile):null;
  return [method,{generationStatus:run?.results.find((r:any)=>r.method===method)?.status??(fs.existsSync(dir)?'INCOMPLETE':'PENDING'),
   stopReason:run?.stopReason??null,calls:run?.realModelCalls??null,preExec:oracle?.preExec??null,
   oracle:oracle?.oracle??'PENDING',behaviorPassed:oracle?.behaviorPassed??null,
   inputTokens:usage?.inputTokens??null,outputTokens:usage?.outputTokens??null,latencyMs:usage?.latencyMs??null,model:usage?.model??null}];
 }))}));
 const totals=Object.fromEntries(batchMethods.map(method=>{
  const values=rows.map((row:any)=>row.methods[method]);
  return [method,{operations:rows.length,generated:values.filter((r:any)=>r.generationStatus==='CANDIDATE_RECEIVED').length,
   oraclePassed:values.filter((r:any)=>r.behaviorPassed===true).length,oracleFailed:values.filter((r:any)=>r.oracle==='FAIL').length,
   preExecPassed:values.filter((r:any)=>r.preExec===true).length,oracleNotEvaluated:values.filter((r:any)=>r.oracle==='NOT_EVALUATED').length,
   evaluationErrors:values.filter((r:any)=>r.oracle==='EVALUATION_ERROR').length,pending:values.filter((r:any)=>r.oracle==='PENDING').length,
   calls:values.reduce((s:number,r:any)=>s+(r.calls??0),0),inputTokens:values.reduce((s:number,r:any)=>s+(r.inputTokens??0),0),
   outputTokens:values.reduce((s:number,r:any)=>s+(r.outputTokens??0),0),latencyMs:values.reduce((s:number,r:any)=>s+(r.latencyMs??0),0),
   interrupted:values.filter((r:any)=>r.stopReason||r.generationStatus==='INCOMPLETE'||r.generationStatus==='UNKNOWN').length,
   usageMissing:values.filter((r:any)=>r.calls&&r.inputTokens===null).length}];
 }));
 const summary={version:plan.version,formalExperimentReady:false,totals,rows};
 save(`${root}/batch-summary.json`,summary);return totals;
}
