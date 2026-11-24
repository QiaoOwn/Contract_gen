import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse as dotenv} from 'dotenv';
import {prepareFullGuidedV2,auditFullGuidedV2,fullGuidedRunMetadata} from './lib/fullGuidedGenerationV2';
import {rq1Generate} from './lib/rq1NarrativeComparisons';
import {reserved6,httpTransport6} from './lib/contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './lib/contractgenStage8';
import {hash,read,save} from './lib/m4LiveAdapter';
import {prepareSourceRevisedRequest} from './lib/sourceRevisedGeneration';

function sourceFiles(dir:string):string[]{return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=`${dir}/${e.name}`;return e.isDirectory()?sourceFiles(p):/\.(ts|json|g4|txt)$/.test(e.name)?[p]:[];
});}
async function main(){
 const args=process.argv.slice(2),allowed=['--operation','--output','--preview','--execute-paid','--source-revision','--method'];
 for(let i=0;i<args.length;i++){assert(allowed.includes(args[i]),'Unknown option');if(args[i]!=='--execute-paid'){assert(args[i+1]&&!args[i+1].startsWith('--'),'Missing value');i++;}}
 const get=(k:string)=>args.includes(k)?args[args.indexOf(k)+1]:'';
 const out=get('--output');assert(out&&!fs.existsSync(out),'Fresh output required');
 if(!args.includes('--execute-paid')){
  const id=get('--operation');assert(id,'Operation required');
  const method=get('--method')||'full';assert(method==='direct'||method==='full');
  assert(method==='full'||get('--source-revision'),'Direct entry requires a source revision');
  const p=get('--source-revision')?prepareSourceRevisedRequest(id,get('--source-revision'),method):prepareFullGuidedV2(id);
  const files=[...sourceFiles('src'),...sourceFiles('antlr4'),...sourceFiles('public').filter(f=>f.endsWith('.ts')),
   ...sourceFiles('scripts/lib'),'scripts/run_full_guided_v2.ts','config/contractgen-stage8-pilot-v1.json',
   'data/narrative_v3_114/generation/requirements.jsonl',`data/narrative_v3_114/generation/models/${id}/typed-model.json`,
   `data/narrative_v3_114/generation/models/${id}/signature.json`];
  if(get('--source-revision')){const m=read(get('--source-revision'));files.push(get('--source-revision'),m.baseFile,m.revisionFile,m.sourceFile);}
  save(`${out}/request.json`,{messages:p.request.messages,requestHash:p.requestHash});
  save(`${out}/decision-plan.json`,p.decisions);
  save(`${out}/audit.json`,{baseline:p.request.base.prepared,characters:p.characters,immutable:p.immutable});
  const digests=Object.fromEntries([...new Set([...files,`${out}/request.json`,`${out}/decision-plan.json`,`${out}/audit.json`])].map(f=>[f,hash(fs.readFileSync(f))]));
  save(`${out}/identity.json`,{version:p.version,operationId:id,method,generationRevision:p.version,requestHash:p.requestHash,
   targetLanguageVersion:p.request.base.common.TargetLanguage.version,targetLanguageHash:p.request.base.common.TargetLanguage.sha256,
   sourceRevision:get('--source-revision')||null,
   files:digests,maximumCalls:1,timeoutMs:600000,config:read('config/contractgen-stage8-pilot-v1.json'),oracleFeedback:false});
  console.log(JSON.stringify({preview:out,revision:p.version,maximumCalls:1,paidCalls:0,characters:p.characters}));return;
 }
 assert(get('--preview')&&!get('--operation'),'Paid run requires only a frozen preview and output');
 const preview=get('--preview'),i=read(`${preview}/identity.json`);assert(['full-guided-generation-v2','source-revised-direct-v1','source-revised-direct-v2'].includes(i.version));
 const verify=()=>{for(const [f,h]of Object.entries(i.files))assert.equal(hash(fs.readFileSync(f)),h,`Frozen drift: ${f}`);};verify();
 const p=i.sourceRevision?prepareSourceRevisedRequest(i.operationId,i.sourceRevision,i.method):prepareFullGuidedV2(i.operationId);assert.equal(p.requestHash,i.requestHash);
 const env={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
 const endpoint=env.OPENAI_BASE_URL,key=env.OPENAI_API_KEY||env.API_KEY;assert(endpoint&&key,'Missing API config');
 const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
 const reservation=tokenReservation8(p.request.messages,i.config);
 const slot=`${i.method||'full'}__1`;
 save(`${out}/run.json`,fullGuidedRunMetadata(preview,i));
 save(`${out}/budget/${slot}.json`,{slot,...reservation,refundable:false});
 let calls=0,transportCalls=0,stopReason:string|null=null,status='UNKNOWN';
 try{
  const result=await rq1Generate(p.request,async messages=>{
   assert.equal(++calls,1,'One first-generation call only');verify();
   const transport=httpTransport6(endpoint,key,i.config.sampling,i.timeoutMs);
   const response=await reserved6(out,slot,messages,hash(JSON.stringify(messages)),async request=>{
    transportCalls++;return transport(request);
   });
   const raw=read(`${out}/${slot}/raw-response.json`);
   assert(responseModelAccepted8(i.config,raw.raw?.body?.model),'Unexpected model');
   assert(raw.inputTokens==null||raw.inputTokens<=reservation.inputTokensReserved,'Input usage overflow');
   assert(raw.outputTokens==null||raw.outputTokens<=reservation.outputTokensReserved,'Output usage overflow');
   return response;
  });
  save(`${out}/${i.method||'full'}.candidate.json`,{...result,generationRevision:i.version,decisionAudit:auditFullGuidedV2(p,result.candidate.contract)});status='CANDIDATE_RECEIVED';
 }catch(error){stopReason=String(error);const f=`${out}/${slot}/outcome.json`;status=fs.existsSync(f)&&read(f).status==='received'?'GENERATION_ERROR':'UNKNOWN';}
 const entries:Record<string,string>={};const walk=(d:string)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else entries[f]=hash(fs.readFileSync(f));}};walk(out);
 save(`${out}/generation-seal.json`,{entries,feedbackAllowed:false,interrupted:stopReason!==null});
 save(`${out}/summary.json`,{operationId:i.operationId,generationRevision:i.version,results:[{method:i.method||'full',status,calls}],stopReason,
  realModelCalls:transportCalls,logicalAttempts:calls,hiddenJestEvaluations:0});
 console.log(JSON.stringify({status,stopReason,calls,output:out}));if(stopReason)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
