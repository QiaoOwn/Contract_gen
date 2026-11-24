import fs from 'node:fs';
import assert from 'node:assert/strict';
import {digestFile} from './lib/rq1Batch114';
import {prepareFullGuidedV2} from './lib/fullGuidedGenerationV2';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {rq3CurrentSourceFiles} from './rq3SourceRevision';

async function main(){
 globalThis.fetch=async()=>{throw Error('Offline candidate replay forbids network');};
 const out='results/rq3-failure-pool-replay-v1';fs.mkdirSync(out,{recursive:true});
 const source='results/rq3-failure-pool-audit-v1/records.json';
 const files=rq3CurrentSourceFiles();files[source]=digestFile(source);files['scripts/replay_rq3_failure_pool.ts']=digestFile('scripts/replay_rq3_failure_pool.ts');
 const verify=()=>{for(const [f,h]of Object.entries(files))assert.equal(digestFile(f),h,`Revision drift: ${f}`);};
 const identity={version:'rq3-offline-pool-replay-v1',files,hiddenOracleFeedbackUsed:false,realModelCalls:0,paidCalls:0};
 const identityFile=`${out}/identity.json`;
 if(fs.existsSync(identityFile))assert.deepEqual(JSON.parse(fs.readFileSync(identityFile,'utf8')),identity);else fs.writeFileSync(identityFile,JSON.stringify(identity,null,2));
 const rows=JSON.parse(fs.readFileSync(source,'utf8')).filter((r:any)=>r.status==='recorded-preexec-failure');
 const unique=new Map<string,any>();
 for(const row of rows){assert.equal(digestFile(row.file),row.sha256);const prior=unique.get(row.candidateIdentity);if(prior)prior.origins.push({method:row.origin,file:row.file,sha256:row.sha256});else unique.set(row.candidateIdentity,{...row,origins:[{method:row.origin,file:row.file,sha256:row.sha256}]});}
 const results=[];let i=0;
 for(const row of unique.values()){
  verify();const file=`${out}/${row.candidateIdentity}.json`;let record;
  if(fs.existsSync(file)){record=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(record.candidateIdentity,row.candidateIdentity);}
  else{
   const prepared=prepareFullGuidedV2(row.operationId);
   const evaluation=await evaluateStage5Public(prepared.request.loaded.input,prepared.request.loaded.context,{contract:row.initialContract});
   record={operationId:row.operationId,candidateIdentity:row.candidateIdentity,origins:row.origins,contract:row.initialContract,evaluation,
    status:evaluation.publicProtocolValid?(evaluation.evaluation?.preExecValid?'now-preexec-valid':'still-preexec-failure'):'protocol-invalid',hiddenJestEvaluations:0};
   fs.writeFileSync(file,JSON.stringify(record,null,2));
  }
  results.push(record);console.log(`[${++i}/${unique.size}] ${row.operationId}: ${record.status}`);
 }
 verify();
 const counts:Record<string,number>={};for(const r of results)counts[r.status]=(counts[r.status]??0)+1;
 const strata:Record<string,Record<string,number>>={};for(const r of results)for(const o of r.origins){strata[o.method]??={};strata[o.method][r.status]=(strata[o.method][r.status]??0)+1;}
 fs.writeFileSync(`${out}/summary.json`,JSON.stringify({uniqueCandidates:results.length,counts,strata,eligible:results.filter(r=>r.status==='still-preexec-failure').map(r=>({operationId:r.operationId,candidateIdentity:r.candidateIdentity,origins:r.origins})),realModelCalls:0,paidCalls:0,hiddenJestEvaluations:0,historicalResultsModified:false},null,2));
 console.log({counts,strata});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
