import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {digestFile} from './lib/rq1Batch114';

const args=process.argv.slice(2),allowed=new Set(['--mode','--output','--strategy','--suite','--seed','--execute-paid']);
for(let i=0;i<args.length;i++){assert(allowed.has(args[i]),`Unknown option ${args[i]}`);if(args[i]!=='--execute-paid'){assert(args[i+1]&&!args[i+1].startsWith('--'));i++;}}
const get=(k:string,f='')=>args.includes(k)?args[args.indexOf(k)+1]:f;
const mode=get('--mode','prepare'),root=get('--output','results/rq3-controlled-execution-v1'),suite=get('--suite','all'),strategy=get('--strategy','all');
assert(['prepare','mock','run','status'].includes(mode));assert(['all','smoke'].includes(suite));if(mode!=='run')assert(!args.includes('--execute-paid'));
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(p:string,v:unknown)=>{const fd=fs.openSync(p,'wx');try{fs.writeFileSync(fd,JSON.stringify(v,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
const seedRoot='results/rq3-controlled-seeds-v3';for(const [p,h]of Object.entries(read(`${seedRoot}/manifest.json`).files))assert.equal(digestFile(p),h);
const smoke=['CoCoME_manageStore_queryStore__rename-definition','CoCoME_manageStore_queryStore__definition-type','CoCoME_processSale_enterItem__illegal-prestate','LoanProcessingSystem_loanPayment_loanPayment__result-type'];
const seeds=read(`${seedRoot}/seeds.json`).filter((s:any)=>(suite!=='smoke'||smoke.includes(s.seedId))&&(!get('--seed')||get('--seed')===s.seedId));assert(seeds.length&&seeds.every((s:any)=>s.qualification==='qualified'));
const strategies=strategy==='all'?['simple','conversational','dependency-guided']:[strategy];assert(strategies.every(s=>['simple','conversational','dependency-guided'].includes(s)));
if(!fs.existsSync(root)){
 assert(mode==='prepare','Prepare first');fs.mkdirSync(root,{recursive:true});
 save(`${root}/selection.json`,{version:'rq3-controlled-execution-v1',suite,seeds:seeds.map((s:any)=>s.seedId),strategies:['simple','conversational','dependency-guided'],maximumNewCalls:seeds.length*3*4,
  noRepair:seeds.map((s:any)=>({seedId:s.seedId,operationId:s.operationId,initialContractHash:s.initialContractHash,preExec:false,newCalls:0})),
  files:Object.fromEntries(['scripts/run_rq3_controlled_batch.ts','scripts/run_rq3_controlled_repair.ts','scripts/rq3OrdinaryRepair.ts','src/app/service/typescriptOclLocalization.ts',`${seedRoot}/manifest.json`].map(p=>[p,digestFile(p)]))});
}
const selection=read(`${root}/selection.json`);assert.equal(selection.suite,suite);assert(seeds.every((s:any)=>selection.seeds.includes(s.seedId)));for(const [p,h]of Object.entries(selection.files))assert.equal(digestFile(p),h);
let index=0;const records=[];
for(const seed of seeds)for(const arm of strategies){
 const preview=`${root}/previews/${seed.seedId}/${arm}`,output=`${root}/${mode==='mock'?'mock':'runs'}/${seed.seedId}/${arm}`;index++;
 if(mode==='status'){const file=`${root}/runs/${seed.seedId}/${arm}/summary.json`;records.push(fs.existsSync(file)?read(file):{seedId:seed.seedId,strategy:arm,status:'PENDING'});continue;}
 const target=mode==='prepare'?preview:output;
 if(fs.existsSync(target)){assert(mode==='prepare','Execution exists: inspect it; no automatic retry');assert(fs.existsSync(`${target}/identity.json`));continue;}
 if(mode!=='prepare')assert(fs.existsSync(`${preview}/identity.json`),'Matching preview required');if(mode==='run')assert(args.includes('--execute-paid'),'Explicit paid flag required');
 console.log(`[${index}/${seeds.length*strategies.length}] ${mode} ${seed.seedId} ${arm}`);
 const command=['--import','tsx','scripts/run_rq3_controlled_repair.ts','--mode',mode==='prepare'?'preview':mode,'--seed',seed.seedId,'--strategy',arm,'--output',target];if(mode==='run')command.push('--preview',preview,'--execute-paid');
 const child=spawnSync(process.execPath,command,{stdio:'inherit'});assert.equal(child.status,0,`Stopped at ${target}; inspect before resuming`);records.push({seedId:seed.seedId,strategy:arm,output:target});
}
console.log({mode,records,maximumNewCalls:selection.maximumNewCalls,realCallsAllowed:mode==='run'&&args.includes('--execute-paid')});
