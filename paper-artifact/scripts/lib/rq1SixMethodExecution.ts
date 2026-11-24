import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {rq1Methods,rq1Request,rq1Generate,Rq1OutputProtocolError} from './rq1NarrativeComparisons';
import {reserved6,httpTransport6,type Transport6} from './contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './contractgenStage8';
import {hash,read,save} from './m4LiveAdapter';
export function prepareSix(preview:string,id:string,methods:readonly (typeof rq1Methods[number])[]=rq1Methods){
 assert(!fs.existsSync(preview),'Fresh preview required');
 assert(methods.length>0&&new Set(methods).size===methods.length&&methods.every(m=>rq1Methods.includes(m)),'Invalid or duplicate methods');
 const config=read('config/contractgen-stage8-pilot-v1.json');
 const requests=methods.map(method=>rq1Request(id,method));
 const sources=['scripts/lib/rq1SixMethodExecution.ts','scripts/lib/rq1NarrativeComparisons.ts','scripts/lib/rq1OutputNormalization.ts','scripts/lib/contractgenStage5.ts',
  'scripts/lib/contractgenStage6.ts','scripts/lib/contractgenStage8.ts','scripts/run_rq1_six_method_smoke.ts',
  'config/contractgen-stage8-pilot-v1.json','data/narrative_v3_114/generation/requirements.jsonl',
  `data/narrative_v3_114/generation/models/${id}/typed-model.json`,`data/narrative_v3_114/generation/models/${id}/signature.json`,
  'src/app/service/narrativeInputV4.ts','src/app/service/narrativeObligationCompilerV4.ts','src/app/service/narrativeRoleResolverV4.ts',
  'src/app/service/narrativeRelationCompilerV4.ts','src/app/service/prompts/generationRules.v5.json','src/app/service/prompts/generationGrammar.txt',
  'src/app/service/ocltsvmLanguageSpecification.ts','src/app/service/prompts/ocltsvmLanguage.v1.json'];
 const files=Object.fromEntries(sources.map(file=>[file,hash(fs.readFileSync(file))]));
 const slots=requests.flatMap(r=>Array.from({length:r.calls},(_,n)=>`${r.method}__${n+1}`));assert(slots.length>0&&slots.length<=9);
 for(const r of requests){save(`${preview}/${r.method}.json`,{messages:r.messages,extraction:r.extraction,clauseRequests:r.clauseRequests,requestHash:r.hash});files[`${preview}/${r.method}.json`]=hash(fs.readFileSync(`${preview}/${r.method}.json`));}
 const identity={version:'rq1-six-method-live-smoke-v1',operationId:id,config,files,slots,methods,promptVersions:Object.fromEntries(requests.map(r=>[r.method,r.promptVersion])),targetLanguageVersion:requests[0].base.common.TargetLanguage.version,targetLanguageHash:requests[0].base.common.TargetLanguage.sha256,timeoutMs:600000,maximumCalls:9,maximumReservedTokens:1000000,
  requestHashes:Object.fromEntries(requests.map(r=>[r.method,r.hash])),repair:false,hiddenFeedback:false};
 save(`${preview}/identity.json`,identity);
 save(`${preview}/authorization-draft.json`,{approved:false,acknowledgement:'AUTHORIZE_RQ1_SIX_METHOD_9_CALLS',identityHash:hash(JSON.stringify(identity)),
  endpointHash:null,outputDirectory:null,expiresAt:null,maximumCalls:9,maximumReservedTokens:1000000,providerConfirmed:false});
 return {identityHash:hash(JSON.stringify(identity)),maximumCalls:9,paidCalls:0};
}
export function verifySix(preview:string){const i=read(`${preview}/identity.json`);assert.equal(i.version,'rq1-six-method-live-smoke-v1');
 for(const [file,digest]of Object.entries(i.files))assert.equal(hash(fs.readFileSync(file)),digest,`Frozen drift ${file}`);return i;}
export function authorizeSix(preview:string,output:string,auth:any,endpoint:string){
 const i=verifySix(preview);assert(auth.approved===true&&auth.acknowledgement==='AUTHORIZE_RQ1_SIX_METHOD_9_CALLS');
 assert.equal(auth.identityHash,hash(JSON.stringify(i)));assert.equal(auth.endpointHash,hash(endpoint));assert.equal(auth.outputDirectory,path.resolve(output));
 assert(Date.parse(auth.expiresAt)>Date.now());assert(auth.maximumCalls===9&&auth.maximumReservedTokens===1000000&&auth.providerConfirmed===true);
 const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
 assert(!fs.existsSync(output),'Existing run cannot be retried');return i;
}
export async function executeSix(preview:string,output:string,transport:Transport6,mock:boolean,live?:{auth?:any;endpoint?:string;executePaid?:boolean}){
 if(!mock){
  assert(live,'Explicit paid execution required');
  if(live.executePaid!==true){assert(live.auth&&live.endpoint,'Explicit paid execution required');authorizeSix(preview,output,live.auth,live.endpoint);}
 }
 const i=verifySix(preview);assert(!fs.existsSync(output));
 save(`${output}/run.json`,{version:i.version,identityHash:hash(JSON.stringify(i)),preview,config:i.config,slots:i.slots,mock});
 const results:any[]=[];let stopped:string|null=null;
 try{for(const method of rq1Methods.filter(m=>!i.methods||i.methods.includes(m))){
  verifySix(preview);const r=rq1Request(i.operationId,method);assert.equal(r.hash,i.requestHashes[method]);let n=0;
  try{
   const result=await rq1Generate(r,async messages=>{
    const slot=`${method}__${++n}`,reservation=tokenReservation8(messages,i.config);
    const lock=fs.openSync(`${output}/.budget-lock`,'wx');
    try{
     const prior=fs.existsSync(`${output}/budget`)?fs.readdirSync(`${output}/budget`).map(f=>read(`${output}/budget/${f}`)):[];
     assert(i.slots.includes(slot)&&prior.length<i.slots.length&&prior.every(p=>fs.existsSync(`${output}/${p.slot}/outcome.json`)),'Uncertain prior call or exhausted selected budget; inspect only');
     assert(prior.reduce((s,p)=>s+p.totalReserved,0)+reservation.totalReserved<=1000000,'Token cap exceeded');
     save(`${output}/budget/${slot}.json`,{slot,...reservation,refundable:false});
    }finally{fs.closeSync(lock);fs.unlinkSync(`${output}/.budget-lock`);}
    const value=await reserved6(output,slot,messages,hash(JSON.stringify(messages)),async request=>{
     const response=await transport(request);save(`${output}/${slot}/transport-response.json`,response);return response;
    });
    const response=read(`${output}/${slot}/raw-response.json`);
    if(!mock)assert(responseModelAccepted8(i.config,response.raw?.body?.model),'Unexpected or absent provider model; stop');
    assert(response.inputTokens==null||response.inputTokens<=reservation.inputTokensReserved,'Input usage overflow');
    assert(response.outputTokens==null||response.outputTokens<=reservation.outputTokensReserved,'Output usage overflow');
    return value;
   });
   save(`${output}/${method}.candidate.json`,result);results.push({method,status:'CANDIDATE_RECEIVED',calls:n});
  }catch(error){
   const statusFile=`${output}/${method}__${n}/outcome.json`;
   const status=fs.existsSync(statusFile)?read(statusFile).status:'unknown';
   results.push({method,status:status==='unknown'?'UNKNOWN':'PROTOCOL_ERROR',calls:n,error:String(error)});
   if(error instanceof Rq1OutputProtocolError){save(`${output}/${method}.protocol-error.json`,{error:String(error),remainingMethodCallsCancelled:true});}
   else if(status!=='protocol-invalid')throw error;
  }
 }}catch(error){stopped=String(error);}
 for(const method of rq1Methods)if(!results.some(r=>r.method===method))results.push({method,status:i.methods&&!i.methods.includes(method)?'NOT_SELECTED':'NOT_EXECUTED',calls:0});
 const entries:Record<string,string>={};
 const walk=(dir:string)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else entries[file]=hash(fs.readFileSync(file));}};walk(output);
 save(`${output}/generation-seal.json`,{entries,interrupted:stopped!==null,feedbackAllowed:false});
 save(`${output}/summary.json`,{version:i.version,operationId:i.operationId,results,stopReason:stopped,
  reservations:results.reduce((s,r)=>s+r.calls,0),realModelCalls:mock?0:results.reduce((s,r)=>s+r.calls,0),paidCalls:mock?0:'see reservations',
  hiddenJestEvaluations:0,interpretation:mock?'Mock transport; not model quality':'First generation only; terminal behavior evaluation remains separate'});
 return {methods:results.length,stopped,paidCalls:mock?0:'see reservations'};
}
export {httpTransport6};
