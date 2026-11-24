import fs from 'node:fs';
import assert from 'node:assert/strict';
import {call8,execute8,request8,units8,sealed8} from './lib/contractgenStage8';
import {read,save} from './lib/m4LiveAdapter';
async function main(){
 const out=process.argv[2];assert(out&&!fs.existsSync(out),'Fresh output required');
 global.fetch=async()=>{throw Error('Offline only');};
 const config=read('config/contractgen-stage8-pilot-v1.json'),checks:string[]=[];
 const slots=config.pilot.flatMap((id:string)=>['A','B-extract','B-generate','C','D','E'].map(s=>`${id}__${s}`));
 const preview=`${out}/preview`,requests=config.pilot.flatMap((id:string)=>['A','B','C','D','E'].map((arm:any)=>({operationId:id,arm,joint:request8(id,arm).requestHash})));
 save(`${preview}/identity.json`,{version:'contractgen-stage8-preflight-v1',maxLogicalCalls:18,files:{},requests:[],config,slots});
 // The execution fixture identity includes request hashes; no paid authorization is created.
 const identity=read(`${preview}/identity.json`);identity.requests=requests.map((r:any)=>{const file=`${preview}/${r.operationId}-${r.arm}.json`,q=request8(r.operationId,r.arm);save(file,{messages:q.messages,extractionRequest:q.extractionRequest});return {...r,file,extraction:q.extractionRequest?require('./lib/m4LiveAdapter').hash(JSON.stringify(q.extractionRequest)):null};});
 const coveragePath='results/contractgen-stage6a-preparation-v6/oracle-coverage.json';
 identity.coveragePath=coveragePath;identity.files={[coveragePath]:require('./lib/m4LiveAdapter').hash(fs.readFileSync(coveragePath))};
 const realPreview=`${out}/bound-preview`;save(`${realPreview}/identity.json`,identity);
 const fixtures=new Map<string,unknown>();
 if(process.argv.includes('--terminal'))for(const id of config.pilot){
  const file=[`results/contractgen-rm2pt-v4/formal/gpt-5.5-full-114-v4/runs/${id}/metadata.json`,`results/contractgen-rm2pt-v4/formal/gpt-5.5-remaining-49-hotfix1/${id}/metadata.json`].find(fs.existsSync)!;
  fixtures.set(id,read(file).last_ocl);
 }
 let calls=0;
 const response=(value:any)=>({content:JSON.stringify(value),raw:{mock:true},model:config.sampling.model,inputTokens:1,outputTokens:1,reasoningTokens:0,finishReason:'stop'});
 const complete=await execute8(realPreview,`${out}/mock`,async messages=>{
  calls++;const b=JSON.parse(messages[1].content),id=b.operationId;
  if(b.requiredOutput){const text=b.NarrativeRequirement.text.split('.')[0]+'.';return response({sourceHash:b.NarrativeRequirement.sourceHash,obligations:[{taskId:`${id}/narrative-task/own`,category:'unresolved',obligationText:text,sourceSpans:[{start:0,end:text.length,exactText:text}],referencedRoles:[],referencedParameters:[],extractionStatus:'ambiguous',provenance:['mock'],rationale:'fixture'}]});}
  return response({contract:fixtures.get(id)??{definition:null,precondition:'true',postcondition:'true'}});
 },true);
 assert.equal(complete.interrupted,null);assert.equal(calls,18);assert.equal(units8(`${out}/mock`).length,15);sealed8(`${out}/mock`);checks.push('18 Mock calls, 15 fixed units, own B binding and complete evidence seal');
 if(process.argv.includes('--terminal')){
  const {evaluate8}=await import('./lib/contractgenStage8Evaluation');
  const terminal:any=await evaluate8(`${out}/mock`);assert.equal(terminal.results.length,15);assert(terminal.results.every((r:any)=>r.behavioralPass===true));
  assert.equal(calls,18);checks.push('15 frozen fixture terminal Oracle evaluations; no generation feedback');
 }
 await assert.rejects(execute8(realPreview,`${out}/denied`,async()=>{calls++;return response({});},false));assert.equal(calls,18);checks.push('Paid execution denied before transport');
 const setup=(name:string,limit=1000000)=>{const d=`${out}/${name}`;save(`${d}/run.json`,{config:{...config,limits:{...config.limits,maxTotalReservedTokens:limit}},slots:['x__A','x__B'],mock:true});return d;};
 const messages=[{role:'system',content:'mock'},{role:'user',content:'fixture'}];
 const timeout=setup('timeout');await assert.rejects(call8(timeout,'x__A',messages,async()=>{throw Error('timeout');}));assert.equal(read(`${timeout}/x__A/outcome8.json`).status,'TIMEOUT');
 await assert.rejects(call8(timeout,'x__B',messages,async()=>response({})));checks.push('Timeout preserves unknown dispatch and prevents next call');
 const malformed=setup('malformed');await assert.rejects(call8(malformed,'x__A',messages,async()=>({...response({}),content:'{'})));assert(fs.existsSync(`${malformed}/x__A/raw-response.json`));checks.push('Malformed response saved before parsing');
 const budget=setup('budget',1);let dispatched=0;await assert.rejects(call8(budget,'x__A',messages,async()=>{dispatched++;return response({});}));assert.equal(dispatched,0);checks.push('Token cap blocks transport');
 const replay=setup('replay');await call8(replay,'x__A',messages,async()=>response({contract:{definition:null,precondition:'true',postcondition:'true'}}));await assert.rejects(call8(replay,'x__A',messages,async()=>response({})));checks.push('Reserved slot cannot replay');
 const api=setup('api-error');await assert.rejects(call8(api,'x__A',messages,async()=>({...response({error:'fixture'}),raw:{status:429},finishReason:null as any})));assert.equal(read(`${api}/x__A/outcome8.json`).status,'API_ERROR');checks.push('HTTP error preserved as API_ERROR, not business failure');
 const crash=setup('crash');save(`${crash}/token-reservations/x__A.json`,{slot:'x__A',totalReserved:10});
 await assert.rejects(call8(crash,'x__B',messages,async()=>{throw Error('must not dispatch');}));checks.push('Persisted incomplete reservation blocks recovery dispatch; inspect only');
 const cancelled=`${out}/cancelled`;save(`${cancelled}/run.json`,{config,slots,mock:true});save(`${cancelled}/${config.pilot[0]}__B-generate/skipped.json`,{status:'CANCELLED'});
 assert.equal(units8(cancelled).length,15);assert.equal(units8(cancelled).find((r:any)=>r.operationId===config.pilot[0]&&r.arm==='B').generationStatus,'CANCELLED');checks.push('Cancellation and 14 unexecuted units remain visible');
 const invalidB=await execute8(realPreview,`${out}/invalid-B`,async m=>response(JSON.parse(m[1].content).requiredOutput?{}:{contract:{definition:null,precondition:'true',postcondition:'true'}}),true);
 assert.equal(invalidB.interrupted,null);assert.equal(units8(`${out}/invalid-B`).filter((r:any)=>r.generationStatus==='CANCELLED').length,3);checks.push('Invalid own B extraction cancels second generation without borrowing another arm');
 const unknown=setup('network-unknown');await assert.rejects(call8(unknown,'x__A',messages,async()=>{throw Error('network state unknown');}));assert.equal(read(`${unknown}/x__A/outcome8.json`).status,'UNKNOWN');checks.push('Unknown network result remains separate from timeout and OCL failure');
 save(`${out}/summary.json`,{checks,passed:checks.length,realModelCalls:0,paidCalls:0,hiddenJestEvaluations:0});console.log(JSON.stringify({passed:checks.length,calls,paidCalls:0}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
