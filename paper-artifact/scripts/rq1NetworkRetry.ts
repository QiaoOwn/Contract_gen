import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import type {BatchMethod} from './lib/rq1Batch114';
import {durableWrite,flushEvidence,checkpoint} from './rq1DurableProgress';

export const MAX_NETWORK_RETRIES = 3;
const read=(file:string)=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function networkFailure(root:string,id:string,method:BatchMethod){
 const run=`${root}/runs/${id}/${method}`,slot=`${method}__1`;
 if(!fs.existsSync(`${run}/summary.json`)||!fs.existsSync(`${run}/${slot}/outcome.json`))return null;
 // A received response, candidate or terminal evaluation must never be resampled for better results.
 if(fs.existsSync(`${run}/${method}.candidate.json`)||fs.existsSync(`${run}/${slot}/raw-response.json`)||
  fs.existsSync(`${run}/${slot}/transport-response.json`)||fs.existsSync(`${root}/oracle/${id}/${method}`))return null;
 const summary=read(`${run}/summary.json`),outcome=read(`${run}/${slot}/outcome.json`);
 if(summary.operationId!==id||outcome.status!=='unknown'||!summary.stopReason||
  summary.results?.find((r:any)=>r.method===method)?.status!=='UNKNOWN')return null;
 const message=String(outcome.error??'');
 const transient=/^(TypeError: (fetch failed|terminated)|TimeoutError: The operation was aborted due to timeout|AbortError: The operation was aborted due to timeout)$/.test(message)||
  /^(Error|TypeError): (read )?(ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|UND_ERR_SOCKET|UND_ERR_CONNECT_TIMEOUT)\b/.test(message);
 return transient?{run,slot,message,mayHaveConsumedFees:outcome.mayHaveConsumedFees!==false}:null;
}
export function networkRetryRecords(root:string,method:BatchMethod,id?:string){
 const base=`${root}/network-retries/${method}`;
 if(!fs.existsSync(base))return [];
 const operations=id?[id]:fs.readdirSync(base);
 return operations.flatMap(operation=>{
  const dir=`${base}/${operation}`;if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir).filter(name=>/^retry-\d+$/.test(name)).map(name=>{
   const folder=`${dir}/${name}`;assert(fs.existsSync(`${folder}/reservation.json`),'Retry reservation incomplete; inspect before spending');
   const record=read(`${folder}/reservation.json`);
   assert(fs.existsSync(`${folder}/archived.json`)&&fs.existsSync(`${folder}/failed-run`),'Retry archive incomplete; inspect before spending');
   return {operationId:operation,folder,...record};
  });
 });
}
export function archiveNetworkFailure(root:string,id:string,method:BatchMethod){
 assert(/^[A-Za-z0-9_]+$/.test(id));
 const failed=networkFailure(root,id,method);assert(failed,'Not an eligible response-free network failure; no automatic retry');
 const prior=networkRetryRecords(root,method,id);
 assert(prior.length<MAX_NETWORK_RETRIES,'Network retry limit reached (3); inspect provider/network before continuing');
 const count=prior.length+1,folder=`${root}/network-retries/${method}/${id}/retry-${String(count).padStart(3,'0')}`;
 const resolvedRoot=path.resolve(root),source=path.resolve(failed.run),destination=path.resolve(`${folder}/failed-run`);
 assert(source===path.resolve(root,'runs',id,method));
 assert(source.startsWith(resolvedRoot+path.sep)&&destination.startsWith(resolvedRoot+path.sep));
 flushEvidence(source);
 const files:Record<string,string>={};
 const walk=(dir:string)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);assert(!e.isSymbolicLink(),'Unexpected link in failed evidence');
  if(e.isDirectory())walk(file);else files[path.relative(source,file)]=hash(file);
 }};walk(source);
 const delayMs=10000*2**(count-1);
 durableWrite(`${folder}/reservation.json`,{version:'rq1-network-retry-v1',retryNumber:count,delayMs,
  operationId:id,method,error:failed.message,originalRunPath:failed.run,originalRequestHash:read(`${failed.run}/${failed.slot}/reservation.json`).requestHash,
  failedGenerationExcludedFromQualityMetrics:true,mayHaveConsumedFees:failed.mayHaveConsumedFees,
  costAndAttemptsExcluded:false,timestamp:new Date().toISOString(),files});
 fs.renameSync(source,destination);
 for(const [relative,digest]of Object.entries(files))assert.equal(hash(path.join(destination,relative)),digest);
 durableWrite(`${folder}/archived.json`,{verified:true,timestamp:new Date().toISOString()});
 checkpoint(root,method,'NETWORK_RETRY_RESERVED',{operationId:id,retryNumber:count,delayMs,archive:folder,
  mayHaveConsumedFees:failed.mayHaveConsumedFees});
 return {retryNumber:count,delayMs,archive:folder};
}
export function waitForNetworkRetry(ms:number){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);}
export function runWithNetworkRetries(root:string,id:string,method:BatchMethod,action:()=>number|null,
 wait:(ms:number)=>void=waitForNetworkRetry){
 for(;;){
  const exit=action();if(exit===0)return;
  if(!networkFailure(root,id,method))throw Error('Non-network failure or response already received; automatic retry forbidden');
  const retry=archiveNetworkFailure(root,id,method);
  console.log(`Network retry ${retry.retryNumber}/${MAX_NETWORK_RETRIES}: ${id}; waiting ${retry.delayMs/1000}s. Prior call may be billed.`);
  wait(retry.delayMs);
 }
}
