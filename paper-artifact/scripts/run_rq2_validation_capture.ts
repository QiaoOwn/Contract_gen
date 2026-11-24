import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readBatchJson as read,digestFile} from './lib/rq1Batch114';
import {save} from './lib/m4LiveAdapter';

const root='results/rq2-validation-narrative-v1',mode=process.argv[2]??'preflight';
assert(['preflight','smoke'].includes(mode),'Use preflight or smoke; no full batch or model mode');
const manifest=read(`${root}/manifest.json`);
const verify=()=>{for(const [f,h]of Object.entries(manifest.files))assert.equal(digestFile(f),h,`Frozen drift: ${f}`);};verify();
const candidates=fs.readFileSync(`${root}/candidates.jsonl`,'utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l));
const pilot=['CoCoME_manageStore_queryStore','LoanProcessingSystem_loanPayment_loanPayment','CoCoME_processSale_enterItem'];
assert.equal(candidates.length,114);assert(pilot.every(id=>candidates.find(r=>r.operation_id===id)?.preexec_valid));
if(mode==='preflight')console.log({operations:114,eligiblePreExec:candidates.filter(r=>r.preexec_valid).length,pilot,realModelCalls:0,paidCalls:0});
else{
 const output=`${root}/capture-smoke-v1`;assert(!fs.existsSync(output),'Fresh smoke output required');
 const lock=`${root}/capture.lock`;const fd=fs.openSync(lock,'wx');fs.closeSync(fd);
 try{
  const records=[];
  for(const id of pilot){
   assert(/^[A-Za-z0-9_]+$/.test(id));const c=candidates.find(r=>r.operation_id===id)!;
   const temporary=path.resolve('test/tmp/semantic-capture',id),archive=path.resolve(output,'preserved-previous-scratch',id);
   assert(temporary.startsWith(path.resolve('test/tmp/semantic-capture')+path.sep));
   assert(archive.startsWith(path.resolve(output)+path.sep));
   if(fs.existsSync(temporary)){fs.mkdirSync(path.dirname(archive),{recursive:true});fs.renameSync(temporary,archive);}
   const file=`${output}/${id}/capture.json`,command=['--import','tsx','scripts/rq2_validation_capture_offline.cjs',
    '--operation-id',id,'--cohort',`${root}/candidates.jsonl`,'--input',`${root}/operations.jsonl`,'--oracle-test',c.oracle_test,'--output',file];
   const child=spawnSync(process.execPath,command,{encoding:'utf8',timeout:300000,maxBuffer:12*1024*1024});
   fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(`${file}.stdout.log`,child.stdout??'');fs.writeFileSync(`${file}.stderr.log`,child.stderr??'');
   verify();const result=fs.existsSync(file)?read(file):null;
   const row={operationId:id,exitCode:child.status,error:child.error?String(child.error):null,success:result?.success===true,
    tests:result?.tests,captures:result?.captures?.length??0,fatalError:result?.fatalError,captureFile:file};records.push(row);console.log(row);
   if(!row.success){save(`${output}/summary.json`,{records,complete:false,realModelCalls:0,paidCalls:0});throw Error('Capture smoke failed; inspect preserved logs, do not alter source candidate');}
  }
  save(`${output}/summary.json`,{records,complete:true,realModelCalls:0,paidCalls:0,scope:'Current frozen candidate interface capture, not newly generated model performance'});
 }finally{fs.unlinkSync(lock);}
}
