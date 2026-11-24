import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import * as babel from '@babel/core';
import * as t from '@babel/types';
import {ContractSeparator} from '../src/app/ContractSeparator';
import {createEntryCode} from '../src/app/service/createEntryCode';
import {digestFile} from './lib/rq1Batch114';

const root='results/rq2-validation-narrative-v1',output=`${root}/purity-v1`;
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(p:string,v:unknown)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2));};
const rows=(p:string)=>fs.readFileSync(p,'utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l));
const verify=()=>{for(const [p,h]of Object.entries(read(`${root}/manifest.json`).files))assert.equal(digestFile(p),h,`Frozen drift: ${p}`);};
globalThis.fetch=async()=>{throw Error('Offline purity study');};
async function main(){
 verify();assert(!fs.existsSync(output),'Fresh purity output required');
 fs.mkdirSync(output,{recursive:true});
 save(`${output}/source-seal.json`,{files:Object.fromEntries(['scripts/run_rq2_purity.ts','scripts/rq2_purity_capture.cjs'].map(p=>[p,digestFile(p)]))});
 const candidates=rows(`${root}/candidates.jsonl`),operations=rows(`${root}/operations.jsonl`),records:any[]=[];
 const mutators=new Set(['push','pop','shift','unshift','splice','sort','reverse','add','delete','clear','set','includeIfAbsent','removeIfPresent','call']);
 for(const c of candidates){
  const op=operations.find(o=>o.id===c.operation_id);let status='generation_error';const findings:any[]=[];let declarations=0;
  try{
   const generated=await createEntryCode({project:op.project,useCase:op.useCase,operation:op.operation_name,ocl:new ContractSeparator().separate(c.contract) as any});
   const ast=babel.parseSync(generated.entry,{sourceType:'module',parserOpts:{plugins:['typescript']}})!;
   babel.traverse(ast,{VariableDeclaration(p){
    if(!p.node.declarations.some(d=>t.isObjectPattern(d.id)&&d.id.properties.some(k=>t.isObjectProperty(k)&&t.isIdentifier(k.value,{name:'isPostconditionPass'}))))return;
    declarations++;
    const report=(kind:string,n:t.Node)=>findings.push({kind,line:n.loc?.start.line});
    p.traverse({AssignmentExpression(q){report('assignment',q.node);},UpdateExpression(q){report('update',q.node);},UnaryExpression(q){if(q.node.operator==='delete')report('delete',q.node);},ObjectProperty(q){if(t.isIdentifier(q.node.key,{name:'execute'}))report('effect_callback',q.node);},CallExpression(q){const k=q.node.callee;if(t.isMemberExpression(k)&&!k.computed&&t.isIdentifier(k.property)&&mutators.has(k.property.name)){
     if(k.property.name==='add'&&t.isCallExpression(k.object)&&t.isIdentifier(k.object.callee,{name:'dayjs'}))return;
     report('possible_mutator',q.node);
    }}});
   }});
   status=declarations!==1?'missing_checker':findings.length?'write_pattern':'bounded_scan_pass';
   save(`${output}/entries/${c.operation_id}.json`,{entry:generated.entry});
  }catch(e){findings.push({error:String(e)});}
  records.push({operationId:c.operation_id,preExec:c.preexec_valid,status,declarations,findings});
  save(`${output}/static-progress.json`,records);
 }
 const pilot=['CoCoME_manageStore_queryStore','LoanProcessingSystem_loanPayment_loanPayment','CoCoME_processSale_enterItem'],dynamic=[];
 for(const id of pilot){
  const c=candidates.find(c=>c.operation_id===id),dir=`${output}/dynamic/${id}`;fs.mkdirSync(dir,{recursive:true});
  const temp=path.resolve('test/tmp/semantic-capture',id);assert(temp.startsWith(path.resolve('test/tmp/semantic-capture')+path.sep));
  if(fs.existsSync(temp))fs.renameSync(temp,path.resolve(dir,'previous-scratch'));
  const child=spawnSync(process.execPath,['--import','tsx','scripts/rq2_purity_capture.cjs','--operation-id',id,'--cohort',`${root}/candidates.jsonl`,'--input',`${root}/operations.jsonl`,'--oracle-test',c.oracle_test,'--output',`${dir}/capture.json`],{encoding:'utf8',timeout:300000,maxBuffer:12*1024*1024});
  fs.writeFileSync(`${dir}/stdout.log`,child.stdout??'');fs.writeFileSync(`${dir}/stderr.log`,child.stderr??'');assert.equal(child.status,0,`Inspect ${dir}/stderr.log`);
  const capture=read(`${dir}/capture.json`);assert(capture.success);
  const boundaries=rows(`${dir}/checker-boundaries.jsonl`);assert(boundaries.length>0&&boundaries.length%2===0);
  let pairs=0;for(let i=0;i<boundaries.length;i+=2){assert.equal(boundaries[i].phase,'before');assert.equal(boundaries[i+1].phase,'after');
   const normalize=(s:any)=>{const {capturedNowMillis,...state}=s;return state;};assert.deepEqual(normalize(boundaries[i].state),normalize(boundaries[i+1].state));pairs++;
  }
  dynamic.push({operationId:id,pairs,tests:capture.tests,unchanged:true});verify();
 }
 const counts=Object.fromEntries([...new Set(records.map(r=>r.status))].map(s=>[s,records.filter(r=>r.status===s).length]));
 verify();save(`${output}/summary.json`,{counts,records,dynamic,realModelCalls:0,paidCalls:0,scope:'Bounded AST write-pattern scan plus observed checker-local state equality; not general purity proof'});
 console.log({counts,dynamic,realModelCalls:0,paidCalls:0});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
