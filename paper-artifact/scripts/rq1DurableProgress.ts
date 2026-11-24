import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readBatchJson,type BatchMethod} from './lib/rq1Batch114';

export function durableWrite(file:string,value:unknown){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 // Unique, immutable checkpoints avoid replacing a file during a power loss.
 const fd=fs.openSync(file,'wx');
 try{fs.writeFileSync(fd,JSON.stringify(value,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
export function appendProgress(file:string,value:unknown){
 fs.mkdirSync(path.dirname(file),{recursive:true});const fd=fs.openSync(file,'a');
 try{fs.writeFileSync(fd,JSON.stringify(value)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
export function flushEvidence(dir:string){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())flushEvidence(file);
  else if(entry.isFile()){
   const fd=fs.openSync(file,'r+');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  }
 }
}
function inspect(file:string){
 if(!fs.existsSync(file))return {value:null,error:null};
 try{return {value:readBatchJson(file),error:null};}catch(error){return {value:null,error:String(error)};}
}
export function durableStatus(root:string,method:BatchMethod){
 const plan=readBatchJson(`${root}/selection.json`);
 const rows=plan.operations.map((id:string,index:number)=>{
  const run=`${root}/runs/${id}/${method}`,oracle=`${root}/oracle/${id}/${method}`;
  const generation=inspect(`${run}/summary.json`),evaluation=inspect(`${oracle}/summary.json`);
  const summary=generation.value,result=summary?.results?.find((r:any)=>r.method===method);
  const behavior=evaluation.value?.results?.find((r:any)=>r.method===method);
  const validGeneration=summary?.operationId===id&&summary.stopReason===null&&
   ['CANDIDATE_RECEIVED','PROTOCOL_ERROR'].includes(result?.status);
  const validOracle=evaluation.value?.operationId===id&&evaluation.value?.source===run&&behavior;
  const state=generation.error||evaluation.error?'UNREADABLE':
   fs.existsSync(run)&&!validGeneration?'INTERRUPTED_OR_UNKNOWN':
   validGeneration&&fs.existsSync(oracle)&&!validOracle?'EVALUATION_INCOMPLETE':
   validGeneration&&validOracle?'COMPLETED':validGeneration?'GENERATED':'PENDING';
  return {position:index+1,operationId:id,state,generationStatus:result?.status??null,stopReason:summary?.stopReason??null,
   preExec:behavior?.preExec??null,oracle:behavior?.oracle??null,behaviorPassed:behavior?.behaviorPassed??null,
   readError:generation.error??evaluation.error};
 });
 return {method,total:rows.length,completed:rows.filter((r:any)=>r.state==='COMPLETED').length,
  generated:rows.filter((r:any)=>['COMPLETED','GENERATED','EVALUATION_INCOMPLETE'].includes(r.state)).length,
  pending:rows.filter((r:any)=>r.state==='PENDING').length,
  interrupted:rows.filter((r:any)=>['INTERRUPTED_OR_UNKNOWN','EVALUATION_INCOMPLETE','UNREADABLE'].includes(r.state)).length,rows};
}
export function checkpoint(root:string,method:BatchMethod,event:string,details:Record<string,unknown>={}){
 const record={timestamp:new Date().toISOString(),event,method,...details};
 const folder=`${root}/progress/${method}`;
 durableWrite(`${folder}/checkpoints/${Date.now()}-${randomUUID()}.json`,record);
 appendProgress(`${folder}/events.jsonl`,record);
 return record;
}
export function showDurableStatus(root:string,method:BatchMethod){
 const status=durableStatus(root,method);
 console.log(`[${method}] completed=${status.completed}/${status.total}; generated=${status.generated}; pending=${status.pending}; interrupted=${status.interrupted}`);
 return status;
}
