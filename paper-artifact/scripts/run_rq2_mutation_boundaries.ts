import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {digestFile} from './lib/rq1Batch114';
const root='results/rq2-validation-narrative-v1',base=`${root}/mutation-pilot-v1`,out=`${root}/mutation-boundaries-v1`;
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(p:string,v:unknown)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2));};
const verify=()=>{for(const f of [`${root}/manifest.json`,`${base}/seal.json`])for(const [p,h]of Object.entries(read(f).files))assert.equal(digestFile(p),h);};
verify();assert(!fs.existsSync(out),'Fresh output required');
const mutations=read(`${base}/plan.json`).mutations.map((m:any)=>{
 const captures=read(m.captureFile).captures;const eligible=captures.map((c:any,i:number)=>({c,i})).filter(({c}:any)=>!c.errorName&&c.testStatus==='passed');
 assert(eligible.length>=2);const chosen=eligible[1];assert.notEqual(chosen.i,m.source_capture_index);
 return {...m,source_capture_index:chosen.i,source_test_name:chosen.c.currentTestName};
});
save(`${out}/plan.json`,{mutations,scope:'Second successful snapshot per operation; same six fault definitions'});
save(`${out}/seal.json`,{files:Object.fromEntries(['scripts/run_rq2_mutation_boundaries.ts',`${out}/plan.json`].map(p=>[p,digestFile(p)]))});
const records:any[]=[];
const state=(s:any)=>{const {capturedNowMillis,...v}=s;return v;};
for(const m of mutations){
 assert.equal(digestFile(m.captureFile),m.captureSha256);const results:any={};
 for(const enabled of [true,false]){
  const dir=`${out}/${m.mutation_id}/${enabled?'enabled':'disabled'}`;fs.mkdirSync(dir,{recursive:true});
  const temp=path.resolve('test/tmp/poststate-result-mutant',m.operation_id);assert(temp.startsWith(path.resolve('test/tmp/poststate-result-mutant')+path.sep));
  if(fs.existsSync(temp))fs.renameSync(temp,path.resolve(dir,'previous-scratch'));
  const args=['--import','tsx','scripts/rq2_mutant_offline.cjs','--operation-id',m.operation_id,'--cohort',`${root}/candidates.jsonl`,'--input',`${root}/operations.jsonl`,'--capture',m.captureFile,'--capture-index',String(m.source_capture_index),'--mode','state-mutant','--mutation-manifest',`${out}/plan.json`,'--mutation-id',m.mutation_id];if(!enabled)args.push('--disable-checker');
  const c=spawnSync(process.execPath,args,{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});fs.writeFileSync(`${dir}/stdout.log`,c.stdout??'');fs.writeFileSync(`${dir}/stderr.log`,c.stderr??'');assert.equal(c.status,0,`Inspect ${dir}`);
  const lines=c.stdout.trim().split(/\r?\n/),r=JSON.parse(lines[lines.length-1]);save(`${dir}/result.json`,r);results[enabled?'enabled':'disabled']=r;verify();
 }
 assert.deepEqual(state(results.enabled.before),state(results.disabled.before));assert.deepEqual(state(results.enabled.after),state(results.disabled.after));
 const original=read(m.captureFile).captures[m.source_capture_index];assert.notDeepEqual(state(results.disabled.after),state(original.after),'Mutation must alter captured correct outcome');
 const record={mutationId:m.mutation_id,sourceTest:m.source_test_name,enabledDecision:results.enabled.decision,disabledDecision:results.disabled.decision,errorName:results.enabled.error_name,detected:results.enabled.decision===false&&results.enabled.error_name==='PostconditionError'&&results.disabled.decision===true,netStateEqual:true};
 records.push(record);save(`${out}/progress.json`,{records,complete:false});console.log(record);
}
verify();save(`${out}/summary.json`,{complete:true,records,detected:records.filter(r=>r.detected).length,executions:12,operations:3,realModelCalls:0,paidCalls:0});
