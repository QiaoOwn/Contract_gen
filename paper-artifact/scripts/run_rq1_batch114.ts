import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {batchMethods,prepareBatch114,runBatch114,summarizeBatch114,type BatchMethod} from './lib/rq1Batch114';

function main(){
 const args=process.argv.slice(2),options=new Map<string,string>();let paid=false;
 for(let n=0;n<args.length;n++){
  if(args[n]==='--execute-paid'){assert(!paid);paid=true;continue;}
  assert(['--mode','--root','--method'].includes(args[n]),`Unknown option ${args[n]}`);
  assert(!options.has(args[n])&&args[n+1]&&!args[n+1].startsWith('--'),'Duplicate option or missing value');
  options.set(args[n],args[++n]);
 }
 const mode=options.get('--mode')??'prepare',root=options.get('--root')??'results/rq1-four-methods-114-v1';
 assert(['prepare','run','status'].includes(mode));
 assert(mode==='run'||!paid,'Paid switch only valid with run');
 assert(mode==='run'||!options.has('--method'),'Method only valid with run');
 const command=(argv:string[])=>{
  const child=spawnSync(process.execPath,argv,{stdio:'inherit',env:process.env});
  if(child.error)throw child.error;
  assert.equal(child.status,0,'Child process failed. Evidence preserved; no automatic retry.');
 };
 if(mode==='prepare')console.log(prepareBatch114(root,command));
 else if(mode==='status')console.log(JSON.stringify(summarizeBatch114(root),null,2));
 else {
  const method=options.get('--method') as BatchMethod;assert(batchMethods.includes(method),'Select one method');
  console.log(runBatch114(root,method,command,paid));
  console.log(JSON.stringify(summarizeBatch114(root),null,2));
 }
}
try{main();}catch(error){console.error(String(error));process.exitCode=1;}
