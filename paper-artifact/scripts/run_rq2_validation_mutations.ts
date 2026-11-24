import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {digestFile} from './lib/rq1Batch114';

const root='results/rq2-validation-narrative-v1';
const output=`${root}/mutation-pilot-v1`;
const mode=process.argv[2]??'prepare';
assert(['prepare','run'].includes(mode));
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p:string,v:unknown)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2));};
const verify=()=>{for(const [p,h] of Object.entries(read(`${root}/manifest.json`).files))assert.equal(digestFile(p),h,`Frozen drift: ${p}`);};
verify();
const query='CoCoME_manageStore_queryStore',loan='LoanProcessingSystem_loanPayment_loanPayment',item='CoCoME_processSale_enterItem';
const definitions=[
 {mutation_id:'query_wrong_identity',operation_id:query,typescript_statement:'result = getRepository(Store).find((x:any) => x.Id !== id)!;',mutates_result:true,source:'returned object is that same requested store'},
 {mutation_id:'loan_wrong_return',operation_id:loan,typescript_statement:'result = false;',mutates_result:true,source:'returns true'},
 {mutation_id:'loan_wrong_amount',operation_id:loan,typescript_statement:'getRepository(Loan)[0].RemainAmountToPay += 1;',source:"reduces a Loan's remaining amount by that loan's repayment amount"},
 {mutation_id:'item_wrong_return',operation_id:item,typescript_statement:'result = false;',mutates_result:true,source:'operation returns true'},
 {mutation_id:'item_wrong_stock',operation_id:item,typescript_statement:'getRepository(Item).find((x:any) => x.Barcode === barcode)!.StockNumber += 1;',source:'stock is reduced by the entered quantity'},
 {mutation_id:'item_wrong_current_line',operation_id:item,typescript_statement:'this.CurrentSaleLine = getRepository(SalesLineItem)[0];',source:'becomes the current sale line'},
];
if(mode==='prepare'){
 assert(!fs.existsSync(output),'Fresh output required');
 const requirements=fs.readFileSync('data/narrative_v3_114/generation/requirements.jsonl','utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l));
 const mutations=definitions.map(d=>{
  const requirement=requirements.find(r=>r.operationId===d.operation_id);assert(requirement.description.includes(d.source),`Missing exact source: ${d.mutation_id}`);
  const captureFile=`${root}/capture-smoke-v1/${d.operation_id}/capture.json`;
  const captures=read(captureFile).captures;
  const index=captures.findIndex((c:any)=>!c.errorName&&c.testStatus==='passed');assert(index>=0);
  return {...d,obligation_family:d.mutation_id,expected_decision:false,source_requirement:requirement,source_capture_index:index,source_test_name:captures[index].currentTestName,captureFile,captureSha256:digestFile(captureFile)};
 });
 write(`${output}/plan.json`,{version:'rq2-state-mutation-pilot-v1',mutations,realModelCalls:0,paidCalls:0});
 write(`${output}/seal.json`,{files:Object.fromEntries(['scripts/run_rq2_validation_mutations.ts','scripts/rq2_mutant_offline.cjs','scripts/run-ocltsvm-result-mutant.ts',`${output}/plan.json`].map(p=>[p,digestFile(p)]))});
 console.log({prepared:mutations.length,pairedExecutions:18,output});
}else{
 for(const [p,h]of Object.entries(read(`${output}/seal.json`).files))assert.equal(digestFile(p),h);
 const plan=read(`${output}/plan.json`);for(const m of plan.mutations)assert.equal(digestFile(m.captureFile),m.captureSha256);
 assert(!fs.existsSync(`${output}/summary.json`),'Existing result must not be overwritten');
 const lock=`${output}/run.lock`;fs.closeSync(fs.openSync(lock,'wx'));
 const records:any[]=[];
 try{
 const jobs=[...new Set<string>(plan.mutations.map((m:any)=>m.operation_id))].map(id=>({...plan.mutations.find((m:any)=>m.operation_id===id),mutation_id:`control_${id}`,control:true,expected_decision:true})).concat(plan.mutations);
 for(const job of jobs){
  const pair:any={id:job.mutation_id,expectedDecision:job.expected_decision,control:!!job.control};
  for(const enabled of [true,false]){
   const dir=`${output}/runs/${job.mutation_id}/${enabled?'enabled':'disabled'}`;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
   const temp=path.resolve('test/tmp/poststate-result-mutant',job.operation_id),archive=path.resolve(dir,'previous-scratch');
   assert(temp.startsWith(path.resolve('test/tmp/poststate-result-mutant')+path.sep));
   if(fs.existsSync(temp))fs.renameSync(temp,archive);
   const args=['--import','tsx','scripts/rq2_mutant_offline.cjs','--operation-id',job.operation_id,'--cohort',`${root}/candidates.jsonl`,'--input',`${root}/operations.jsonl`,'--capture',job.captureFile,'--capture-index',String(job.source_capture_index),'--mode',job.control?'control':'state-mutant'];
   if(!job.control)args.push('--mutation-manifest',`${output}/plan.json`,'--mutation-id',job.mutation_id);
   if(!enabled)args.push('--disable-checker');
   const c=spawnSync(process.execPath,args,{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
   fs.writeFileSync(`${dir}/stdout.log`,c.stdout??'');fs.writeFileSync(`${dir}/stderr.log`,c.stderr??'');
   assert.equal(c.status,0,`Replay failed: ${dir}; inspect stderr`);
   const lines=c.stdout.trim().split(/\r?\n/);const result=JSON.parse(lines[lines.length-1]);write(`${dir}/result.json`,result);
   pair[enabled?'enabled':'disabled']={decision:result.decision,errorName:result.error_name};
   verify();
  }
  records.push(pair);write(`${output}/progress.json`,{records,complete:false,realModelCalls:0,paidCalls:0});console.log(pair);
 }
 write(`${output}/summary.json`,{records,complete:true,controls:records.filter(r=>r.control).length,mutations:records.filter(r=>!r.control).length,detected:records.filter(r=>!r.control&&r.enabled.decision===false&&r.disabled.decision===true).length,realModelCalls:0,paidCalls:0,scope:'Controlled injected post-state faults; not natural generation accuracy or checker purity'});
 }finally{fs.unlinkSync(lock);}
}
