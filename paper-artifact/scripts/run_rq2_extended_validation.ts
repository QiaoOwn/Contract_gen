import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {digestFile} from './lib/rq1Batch114';

const root='results/rq2-validation-narrative-v1',out=`${root}/extended-v1`,mode=process.argv[2]??'capture';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const rows=(p:string)=>fs.readFileSync(p,'utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l));
const save=(p:string,v:unknown)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2));};
const verify=()=>{for(const [p,h]of Object.entries(read(`${root}/manifest.json`).files))assert.equal(digestFile(p),h,`Frozen drift: ${p}`);};
const staff='Airport_manageUser_createStaff',del='CoCoME_manageStore_deleteStore',sale='CoCoME_processSale_makeNewSale',card='AutomatedTellerMachine_checkBalance_inputCard',borrow='LibraryManagementSystem_borrowBook_borrowBook';
const ids=[staff,del,sale,card,borrow];
function preserve(parent:string,id:string,dest:string){const temp=path.resolve(parent,id);assert(temp.startsWith(path.resolve(parent)+path.sep));if(fs.existsSync(temp)){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.renameSync(temp,path.resolve(dest));}}
function child(args:string[],dir:string){fs.mkdirSync(dir,{recursive:true});const c=spawnSync(process.execPath,['--import','tsx',...args],{encoding:'utf8',timeout:300000,maxBuffer:16*1024*1024});fs.writeFileSync(`${dir}/stdout.log`,c.stdout??'');fs.writeFileSync(`${dir}/stderr.log`,c.stderr??'');verify();assert.equal(c.status,0,`Inspect ${dir}/stderr.log`);return c.stdout;}
const normalize=(s:any)=>{const {capturedNowMillis,...state}=s;return state;};
verify();globalThis.fetch=async()=>{throw Error('Offline validation only');};
if(mode==='capture'){
 assert(!fs.existsSync(out));const candidates=rows(`${root}/candidates.jsonl`);const records=[];
 for(const id of ids){const c=candidates.find(c=>c.operation_id===id);assert(c.preexec_valid&&c.behavior_passed);const dir=`${out}/captures/${id}`;
  preserve('test/tmp/semantic-capture',id,`${dir}/previous-scratch`);
  child(['scripts/rq2_purity_capture.cjs','--operation-id',id,'--cohort',`${root}/candidates.jsonl`,'--input',`${root}/operations.jsonl`,'--oracle-test',c.oracle_test,'--output',`${dir}/capture.json`],dir);
  const doc=read(`${dir}/capture.json`);assert(doc.success);const boundaries=rows(`${dir}/checker-boundaries.jsonl`);assert(boundaries.length>0&&boundaries.length%2===0);for(let i=0;i<boundaries.length;i+=2){assert.equal(boundaries[i].phase,'before');assert.equal(boundaries[i+1].phase,'after');assert.deepEqual(normalize(boundaries[i].state),normalize(boundaries[i+1].state));}
  const r={operationId:id,tests:doc.tests,captures:doc.captures.length,checkerPairs:boundaries.length/2};records.push(r);save(`${out}/capture-progress.json`,records);console.log(r);
 }save(`${out}/capture-summary.json`,{records,complete:true,realModelCalls:0,paidCalls:0});
}else if(mode==='prepare'){
 assert(read(`${out}/capture-summary.json`).complete);assert(!fs.existsSync(`${out}/plan.json`));
 const requirements=rows('data/narrative_v3_114/generation/requirements.jsonl');
 const specs=[
  [staff,'creation_membership','Staff.allInstances()',"getRepository(Staff).splice(getRepository(Staff).findIndex((x:any)=>x.Id===id),1);",'adds a new Staff member'],
  [staff,'created_password','Staff.Password',"getRepository(Staff).find((x:any)=>x.Id===id)!.Password += '__fault';",'password'],
  [del,'deleted_member_restored','Store membership','getRepository(Store).push(targetStore);','Delete the Store'],
  [sale,'created_state','Sale.IsComplete','this.CurrentSale.IsComplete = true;','new Sale is incomplete'],
  [sale,'created_association','Sale.BelongedCashDesk','this.CurrentSale.BelongedCashDesk = undefined as any;','linked to that desk'],
  [sale,'created_collection','CashDesk.ContainedSales','this.CurrentCashDesk.ContainedSales = this.CurrentCashDesk.ContainedSales.filter((x:any)=>x!==this.CurrentSale);','linked to that desk'],
  [card,'found_branch_result','result','result = !result;','returns true'],
  [card,'missing_branch_result','result','result = !result;','returns false'],
  [card,'found_validation','CardIDValidated','this.CardIDValidated = false;','marks its identifier as validated'],
  [borrow,'loan_counter','User.LoanedNumber','user.LoanedNumber += 1;','user loan count increases by one'],
  [borrow,'loan_copy_association','Loan.LoanedCopy','copy.LoanedRecord.find((x:any)=>x.LoanedUser===user)!.LoanedCopy = undefined as any;','linked to the user and copy'],
  [borrow,'loan_collection','BookCopy.LoanedRecord','copy.LoanedRecord = [];',"copy's loan history"],
 ];
 const mutations=specs.map(([id,mutation_id,family,statement,excerpt])=>{
  const requirement=requirements.find(r=>r.operationId===id);assert(requirement.description.includes(excerpt),mutation_id);
  const captureFile=`${out}/captures/${id}/capture.json`,captures=read(captureFile).captures;
  const index=captures.findIndex((c:any)=>!c.errorName&&c.testStatus==='passed'&&(mutation_id==='missing_branch_result'?c.after.result===false:mutation_id.startsWith('found_')?c.after.result===true:true));assert(index>=0,`No applicable source: ${mutation_id}`);
  return {operation_id:id,mutation_id,obligation_family:family,typescript_statement:statement,mutates_result:family==='result',sourceExcerpt:excerpt,requirement,source_capture_index:index,source_test_name:captures[index].currentTestName,captureFile,captureSha256:digestFile(captureFile),expected_decision:false};
 });
 save(`${out}/plan.json`,{mutations});save(`${out}/seal.json`,{files:Object.fromEntries(['scripts/run_rq2_extended_validation.ts','scripts/rq2_purity_capture.cjs','scripts/rq2_mutant_offline.cjs',`${out}/plan.json`].map(p=>[p,digestFile(p)]))});console.log({mutations:mutations.length});
}else if(mode==='run'){
 for(const [p,h]of Object.entries(read(`${out}/seal.json`).files))assert.equal(digestFile(p),h);assert(!fs.existsSync(`${out}/replay-summary.json`));
 const plan=read(`${out}/plan.json`);const controls=[...new Map<string,any>(plan.mutations.map((m:any)=>[`${m.operation_id}:${m.source_capture_index}`,m])).values()].map(m=>({...m,mutation_id:`control_${m.mutation_id}`,control:true}));const records=[];
 for(const job of [...controls,...plan.mutations]){
  assert.equal(digestFile(job.captureFile),job.captureSha256);const pair:any={};
  for(const enabled of [true,false]){
   const dir=`${out}/replay/${job.mutation_id}/${enabled?'enabled':'disabled'}`;assert(!fs.existsSync(dir));preserve('test/tmp/poststate-result-mutant',job.operation_id,`${dir}/previous-scratch`);
   const args=['scripts/rq2_mutant_offline.cjs','--operation-id',job.operation_id,'--cohort',`${root}/candidates.jsonl`,'--input',`${root}/operations.jsonl`,'--capture',job.captureFile,'--capture-index',String(job.source_capture_index),'--mode',job.control?'control':'state-mutant'];if(!job.control)args.push('--mutation-manifest',`${out}/plan.json`,'--mutation-id',job.mutation_id);if(!enabled)args.push('--disable-checker');
   const lines=child(args,dir).trim().split(/\r?\n/);pair[enabled?'enabled':'disabled']=JSON.parse(lines[lines.length-1]);save(`${dir}/result.json`,pair[enabled?'enabled':'disabled']);
  }
  assert.deepEqual(normalize(pair.enabled.before),normalize(pair.disabled.before));assert.deepEqual(normalize(pair.enabled.after),normalize(pair.disabled.after));
  const r={operationId:job.operation_id,id:job.mutation_id,control:!!job.control,enabled:pair.enabled.decision,disabled:pair.disabled.decision,error:pair.enabled.error_name,detected:!job.control&&pair.enabled.decision===false&&pair.disabled.decision===true,netStateEqual:true};
  records.push(r);save(`${out}/replay-progress.json`,{records,complete:false});console.log(r);
 }
 save(`${out}/replay-summary.json`,{records,complete:true,mutations:plan.mutations.length,controls:controls.length,detected:records.filter(r=>r.detected).length,realModelCalls:0,paidCalls:0});
}else throw Error('Use capture, prepare or run');
