import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareReferenceRegistry,verifyReferenceRegistry,referenceSummary,referenceRoot,referenceResults} from './oclReferenceRegistry';
import {loadBatchOperations} from './lib/rq1Batch114';

const mode=process.argv[2]??'status';
try{
 assert(['prepare','replay','status'].includes(mode));
 if(mode==='prepare')console.log(prepareReferenceRegistry());
 else if(mode==='status')console.log(JSON.stringify(referenceSummary().totals,null,2));
 else {
  verifyReferenceRegistry();assert(fs.existsSync(`${referenceRoot}/manifest.json`));
  for(const [index,id]of loadBatchOperations().entries()){
   console.log(`[${index+1}/114] source reference: ${id}`);
   if(!fs.existsSync(`${referenceResults}/records/${id}.json`)){
    const log=`${referenceResults}/logs/${id}`;fs.mkdirSync(log,{recursive:true});
    const out=fs.openSync(`${log}/stdout.log`,'a'),err=fs.openSync(`${log}/stderr.log`,'a');
    let result;
    try{result=spawnSync(process.execPath,['--import','tsx','scripts/run_ocl_reference_offline.cjs',id],{stdio:['ignore',out,err]});}
    finally{fs.closeSync(out);fs.closeSync(err);}
    if(result.error)throw result.error;assert.equal(result.status,0,`Reference replay interrupted: ${id}; inspect logs`);
   }
   const summary=referenceSummary();console.log(JSON.stringify(summary.totals));
  }
 }
}catch(error){console.error(String(error));process.exitCode=1;}
