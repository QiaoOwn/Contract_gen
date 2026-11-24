import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,read,save} from './m4LiveAdapter';
import {prepareStage5Arm,finalizeStage5B,evaluateStage5Public,stage5PublicSchema,type Stage5Arm} from './contractgenStage5';
import {inputs6,reserved6,seal6,assertSealed6,terminal6,diagnostics6,httpTransport6,type Transport6} from './contractgenStage6';
import {boundStudyCoverage} from './narrativeStudyResults';
import {jointBase3} from './narrativeStage3';
import {STRUCTURED_UNIFIED_BASELINE_PATH,verifyStructuredUnifiedBaseline} from '../../src/app/service/structuredUnifiedBaseline';

export const config8Path='config/contractgen-stage8-pilot-v1.json';
export const arms8:Stage5Arm[]=['A','B','C','D','E'];
export const statuses8=['SUCCESS','PROTOCOL_ERROR','API_ERROR','TIMEOUT','CANCELLED','UNKNOWN','NOT_EXECUTED','NOT_EVALUATED'];
export function responseModelAccepted8(config:any,model:unknown){
  const policy=config.responseModelPolicy;
  if(typeof model!=='string'||policy?.requestedModel!==config.sampling.model)return false;
  if(policy.matchMode==='gpt-5.5-family')return /^gpt-5\.5(?:-\d{4}-\d{2}-\d{2})?$/.test(model);
  return Array.isArray(policy.allowedResponseModels)&&policy.allowedResponseModels.includes(model);
}
export function request8(id:string,arm:Stage5Arm){
  const {input,context}=inputs6(id),old=prepareStage5Arm(input,context,arm);
  const body={...old.body,...(['D','E'].includes(arm)?{BehavioralRoles:old.prepared.sections.BehavioralRoleMapping}:{})};
  const messages=[old.messages[0],{role:'user',content:JSON.stringify(body)}];
  const extraction=old.extractionRequest?[{role:'system',content:jointBase3()+'\n'+old.extractionRequest[0].content},old.extractionRequest[1]]:null;
  return {...old,body,messages,extractionRequest:extraction,requestHash:hash(JSON.stringify(messages)),input,context};
}
export function finalize8(r:ReturnType<typeof request8>,own:unknown){
  // Validation and response identity binding remain in the original decomposition adapter.
  const messages=finalizeStage5B(r.input,r.context,r,own);
  return messages;
}
export function tokenReservation8(messages:{role:string;content:string}[],config:any){
  const bytes=Buffer.byteLength(JSON.stringify(messages),'utf8');
  const localLimit=config.limits.maxInputBytesPerCall;
  const contextLimit=config.limits.contextTokens-config.sampling.maxOutputTokens;
  const inputLimit=config.limits.inputByteLimitPolicy==='context-bounded'?contextLimit:localLimit;
  assert(Number.isSafeInteger(inputLimit)&&inputLimit>0,'Invalid input budget configuration');
  assert(bytes<=inputLimit,`Input limit exceeded: ${bytes} bytes > ${inputLimit}; requests are never truncated`);
  assert(bytes+config.sampling.maxOutputTokens<=config.limits.contextTokens,'Conservative context budget exceeded');
  return {inputUtf8Bytes:bytes,inputByteLimit:inputLimit,legacyInputByteLimitExceeded:bytes>localLimit,inputTokensReserved:bytes,outputTokensReserved:config.sampling.maxOutputTokens,
    totalReserved:bytes+config.sampling.maxOutputTokens,
    policy:'Conservative byte-based reservation, not measured tokens or provider tokenizer certification'};
}
export function verify8(preview:string){
  const identity=read(`${preview}/identity.json`);
  assert.equal(identity.version,'contractgen-stage8-preflight-v1');assert.equal(identity.maxLogicalCalls,18);
  for(const [file,digest]of Object.entries(identity.files))assert.equal(hash(fs.readFileSync(file)),digest,`Stage8 frozen drift: ${file}`);
  for(const record of identity.requests){const r=read(record.file);assert.equal(hash(JSON.stringify(r.messages)),record.joint);
    assert.equal(r.extractionRequest?hash(JSON.stringify(r.extractionRequest)):null,record.extraction);}
  return identity;
}
export async function preview8(output:string){
  assert(!fs.existsSync(output),'Fresh preview required');
  const parent=verifyStructuredUnifiedBaseline(),config=read(config8Path);
  assert.equal(config.pilot.length,3);assert.equal(new Set(config.pilot).size,3);
  const files:Record<string,string>={...parent.files,[STRUCTURED_UNIFIED_BASELINE_PATH]:hash(fs.readFileSync(STRUCTURED_UNIFIED_BASELINE_PATH))};
  for(const file of [config8Path,'scripts/lib/contractgenStage8.ts','scripts/lib/contractgenStage8Evaluation.ts','scripts/lib/contractgenStage8Statistics.ts',
    'scripts/prepare_contractgen_stage8.ts','scripts/run_contractgen_stage8.ts','scripts/evaluate_contractgen_stage8.ts','scripts/test_contractgen_stage8.ts',
    'scripts/test_contractgen_stage8_faults.ts','scripts/run_stage8_terminal_offline.cjs','scripts/summarize_contractgen_stage8.ts','scripts/test_stage8_isolation.ts','scripts/test_stage8_statistics.ts','scripts/test_stage8_model_policy.ts'])
    files[file]=hash(fs.readFileSync(file));
  const coveragePath='results/contractgen-stage6a-preparation-v6/oracle-coverage.json';files[coveragePath]=hash(fs.readFileSync(coveragePath));
  const requests:any[]=[],fairness:any[]=[],slots:string[]=[];
  for(const id of config.pilot){
    const common=new Set<string>(),systems=new Set<string>(),schemas=new Set<string>();
    for(const arm of arms8){
      const r=request8(id,arm);common.add(r.commonHash);systems.add(hash(r.messages[0].content));schemas.add(hash(JSON.stringify(r.body.OutputProtocol)));
      const file=`${output}/requests/${id}/${arm}.json`;
      const reservation=tokenReservation8(r.messages,config);
      if(r.extractionRequest)tokenReservation8(r.extractionRequest,config);
      assert.equal('Tn'in r.body,['C','D','E'].includes(arm));
      assert.equal('BehavioralRoles'in r.body,['D','E'].includes(arm));
      assert.equal('GenerationR'in r.body,['D','E'].includes(arm));assert.equal('K'in r.body,arm==='E');
      if(arm==='E')assert(!(r.body as any).K.globalRules.some((rule:any)=>rule.kind==='task-support'));
      save(file,{operationId:id,arm,messages:r.messages,extractionRequest:r.extractionRequest,requestHash:r.requestHash,
        commonHash:r.commonHash,reservation,bodyKeys:Object.keys(r.body),sampling:config.sampling,
        BSecond:'dynamic, own sealed extraction only; preview is not an actual B second request'});
      files[file]=hash(fs.readFileSync(file));
      requests.push({operationId:id,arm,file,joint:r.requestHash,extraction:r.extractionRequest?hash(JSON.stringify(r.extractionRequest)):null,
        systemHash:hash(r.messages[0].content),userHash:hash(r.messages[1].content)});
      fairness.push({operationId:id,arm,commonHash:r.commonHash,sourceHash:r.input.sourceHash,modelHash:r.prepared.fullModelHash,
        keys:Object.keys(r.body),baseSystemUnchanged:r.messages[0].content===prepareStage5Arm(r.input,r.context,arm).messages[0].content,reservation,
        modificationsToStage5:{fullBehavioralRoles:['D','E'].includes(arm),baseRulesInBExtraction:arm==='B'},privateTaskEvidenceRequired:false});
    }
    assert.equal(common.size,1);assert.equal(systems.size,1);assert.equal(schemas.size,1);
    slots.push(...['A','B-extract','B-generate','C','D','E'].map(step=>`${id}__${step}`));
  }
  const identity={version:'contractgen-stage8-preflight-v1',config,files,requests,slots,maxLogicalCalls:18,sdkRetries:0,coveragePath,
    inputUnits:15,maxCallsByArm:{A:3,B:6,C:3,D:3,E:3},repair:false,regeneration:false,hiddenFeedback:false,paidAuthorized:false,
    readiness:'PARTIAL',blockers:['Provider model ID, sampling compatibility and context window unconfirmed offline',
      'Frozen Oracle remains preparation-only; no formal business correctness release asserted']};
  save(`${output}/identity.json`,identity);save(`${output}/fairness.json`,fairness);
  save(`${output}/authorization-draft.json`,{approved:false,acknowledgement:'AUTHORIZE_STAGE8_FIXED_18_CALLS',identitySha256:hash(JSON.stringify(identity)),
    endpointSha256:null,outputDirectory:null,expiresAt:null,maxLogicalCalls:18,maxTotalReservedTokens:config.limits.maxTotalReservedTokens,
    providerConfirmed:false,preparatoryOnly:true});
  return {identitySha256:hash(JSON.stringify(identity)),readiness:identity.readiness,requests:15,slots:18,paidCalls:0};
}
export function authorize8(preview:string,output:string,auth:any,endpoint:string){
  const i=verify8(preview);assert.equal(auth.approved,true);assert.equal(auth.acknowledgement,'AUTHORIZE_STAGE8_FIXED_18_CALLS');
  assert.equal(auth.identitySha256,hash(JSON.stringify(i)));assert.equal(auth.outputDirectory,path.resolve(output));
  assert.equal(auth.endpointSha256,hash(endpoint));assert(Date.parse(auth.expiresAt)>Date.now());
  assert.equal(auth.maxLogicalCalls,18);assert.equal(auth.maxTotalReservedTokens,i.config.limits.maxTotalReservedTokens);
  assert(auth.providerConfirmed===true&&auth.preparatoryOnly===true,'New explicit provider confirmation and preparation scope required');
  const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
  assert(!fs.existsSync(output),'Run cannot be replayed');return i;
}
export async function call8(output:string,slot:string,messages:{role:string;content:string}[],transport:Transport6){
  const run=read(`${output}/run.json`),config=run.config,reservation=tokenReservation8(messages,config);
  const lock=fs.openSync(`${output}/.token-lock`,'wx');
  try{
    assert(!fs.existsSync(`${output}/generation-seal.json`),'Already sealed');
    for(const other of run.slots)if(fs.existsSync(`${output}/${other}/outcome8.json`))
      {const prior=read(`${output}/${other}/outcome8.json`);assert(!['UNKNOWN','TIMEOUT'].includes(prior.status)&&!prior.usageOverflow&&!prior.fatalControlViolation,'Uncertain or invalid dispatch blocks remaining calls');}
    const reserved=fs.existsSync(`${output}/token-reservations`)?fs.readdirSync(`${output}/token-reservations`).map(name=>read(`${output}/token-reservations/${name}`)):[];
    assert(reserved.length<18&&reserved.every((r:any)=>fs.existsSync(`${output}/${r.slot}/outcome.json`)),'Prior reservation incomplete or exhausted');
    assert(reserved.reduce((s:number,r:any)=>s+r.totalReserved,0)+reservation.totalReserved<=config.limits.maxTotalReservedTokens,'Token cap exhausted');
    assert(run.slots.includes(slot));
    save(`${output}/token-reservations/${slot}.json`,{slot,...reservation,refundable:false});
  }finally{fs.closeSync(lock);fs.unlinkSync(`${output}/.token-lock`);}
  const started=performance.now();
  try{
    const value=await reserved6(output,slot,messages,hash(JSON.stringify(messages)),async actual=>{
      const response=await transport(actual);
      // Freeze the complete received transport response before Stage6 parses content.
      save(`${output}/${slot}/transport-response8.json`,response);
      return response;
    });
    const received=read(`${output}/${slot}/raw-response.json`),httpStatus=Number(received.raw?.status??200);
    const protocol=slot.endsWith('__B-extract')?'decomposition-pending-validation':stage5PublicSchema.safeParse(value).success?'valid':'invalid';
    const status=httpStatus>=400?'API_ERROR':protocol==='invalid'?'PROTOCOL_ERROR':'SUCCESS';
    const inputTokens=received.inputTokens,outputTokens=received.outputTokens;
    const usageOverflow=typeof inputTokens==='number'&&typeof outputTokens==='number'&&(inputTokens>reservation.inputTokensReserved||outputTokens>reservation.outputTokensReserved);
    const actualProviderModel=(received.raw as any)?.body?.model??null;
    const acceptedModel=responseModelAccepted8(config,actualProviderModel);
    save(`${output}/${slot}/outcome8.json`,{status,parseStatus:protocol,runId:run.runId,slot,operationId:slot.split('__')[0],
      arm:slot.split('__')[1].split('-')[0],requestHash:hash(JSON.stringify(messages)),systemHash:hash(messages[0].content),
      userHash:hash(messages[1].content),requestedModel:config.sampling.model,actualModel:actualProviderModel,sampling:config.sampling,
      inputTokens,outputTokens,latencyMs:performance.now()-started,finishReason:received.finishReason,
      billableCost:received.raw?.body?.usage?.cost??null,usageOverflow,providerModelMismatch:!acceptedModel,responseModelPolicy:config.responseModelPolicy,
      fatalControlViolation:usageOverflow||(!run.mock&&!acceptedModel),
      dispatchCertainty:'response-received',retryAllowed:false});
    assert(!usageOverflow,'Provider usage exceeded conservative reservation; stop');
    assert(run.mock||acceptedModel,'Provider model missing or outside frozen allowlist; stop');
    return {status,value};
  }catch(error){
    if(!fs.existsSync(`${output}/${slot}/outcome8.json`)){
      const raw=fs.existsSync(`${output}/${slot}/raw-response.json`)?read(`${output}/${slot}/raw-response.json`):null;
      const message=String(error),status=raw?Number(raw.raw?.status)>=400?'API_ERROR':'PROTOCOL_ERROR':/timeout/i.test(message)?'TIMEOUT':'UNKNOWN';
      save(`${output}/${slot}/outcome8.json`,{status,error:message,dispatchCertainty:raw?'response-received':'UNKNOWN',retryAllowed:false,
        inputTokens:raw?.inputTokens??null,outputTokens:raw?.outputTokens??null,latencyMs:performance.now()-started});
    }
    throw error;
  }
}
export async function execute8(preview:string,output:string,transport:Transport6,mock=true,live?:{authorization:unknown;endpoint:string}){
  if(!mock){assert(live,'New paid authorization required before transport');authorize8(preview,output,live.authorization,live.endpoint);}
  const i=verify8(preview);assert(!fs.existsSync(output),'Fresh run directory required');
  save(`${output}/run.json`,{version:'stage8-run-v1',runId:hash(output+new Date().toISOString()),previewDirectory:preview,
    identityHash:hash(JSON.stringify(i)),config:i.config,slots:i.slots,mock,maxLogicalCalls:18,hiddenFeedback:false});
  let interrupted:string|null=null;
  try{
    for(const id of i.config.pilot)for(const arm of arms8){
      const r=request8(id,arm),frozen=i.requests.find((p:any)=>p.operationId===id&&p.arm===arm);
      assert.equal(r.requestHash,frozen.joint);let messages=r.messages;
      if(arm==='B'){
        let own:any;
        try{
          assert.equal(hash(JSON.stringify(r.extractionRequest)),frozen.extraction,'B extraction drift');
          const extracted=await call8(output,`${id}__B-extract`,r.extractionRequest!,transport);assert.equal(extracted.status,'SUCCESS');own=extracted.value;
          assert(Buffer.byteLength(JSON.stringify(own))<=i.config.limits.maxExtractionBytes,'Own extraction response too large');
          messages=finalize8(r,own);
        }catch(error){
          const outcome=read(`${output}/${id}__B-extract/outcome8.json`);
          if(['UNKNOWN','TIMEOUT'].includes(outcome.status)||outcome.fatalControlViolation)throw error;
          save(`${output}/${id}__B-extract/decomposition-validation.json`,{status:'PROTOCOL_ERROR',error:String(error)});
          save(`${output}/${id}__B-generate/skipped.json`,{status:'CANCELLED',reason:'own extraction invalid',error:String(error)});continue;
        }
        save(`${output}/${id}__B-final-binding.json`,{requestHash:hash(JSON.stringify(messages)),
          ownRawResponseHash:hash(fs.readFileSync(`${output}/${id}__B-extract/raw-response.json`)),ownValueHash:hash(JSON.stringify(own))});
      }
      const slot=`${id}__${arm==='B'?'B-generate':arm}`;
      try{const result=await call8(output,slot,messages,transport);if(result.status==='SUCCESS')save(`${output}/${id}__${arm}.candidate.json`,{id,arm,value:result.value});}
      catch(error){const status=fs.existsSync(`${output}/${slot}/outcome8.json`)?read(`${output}/${slot}/outcome8.json`).status:'UNKNOWN';
        if(read(`${output}/${slot}/outcome8.json`).fatalControlViolation||!['API_ERROR','PROTOCOL_ERROR'].includes(status))throw error;}
    }
  }catch(error){interrupted=String(error);}
  // Unvisited slots remain explicit; interruption never silently removes units or triggers a retry.
  for(const slot of i.slots){const base=`${output}/${slot}`;
    if(!fs.existsSync(`${base}/outcome.json`)&&!fs.existsSync(`${base}/skipped.json`))save(`${base}/skipped.json`,{status:'NOT_EXECUTED',reason:interrupted??'not-dispatched'});}
  if(!interrupted){
    seal6(output);
    const entries:Record<string,string>={};
    for(const slot of i.slots)for(const name of ['outcome8.json','transport-response8.json'])if(fs.existsSync(`${output}/${slot}/${name}`))entries[`${output}/${slot}/${name}`]=hash(fs.readFileSync(`${output}/${slot}/${name}`));
    for(const name of fs.readdirSync(output).filter(n=>n.endsWith('__B-final-binding.json')))entries[`${output}/${name}`]=hash(fs.readFileSync(`${output}/${name}`));
    save(`${output}/stage8-seal.json`,{entries,identityHash:hash(JSON.stringify(i))});
  }
  save(`${output}/generation-summary8.json`,{status:interrupted?'INTERRUPTED':'SEALED',error:interrupted,units:units8(output),
    realModelCalls:mock?0:fs.readdirSync(`${output}/token-reservations`).length,paidCalls:mock?0:'see actual reservations/usage'});
  return {interrupted,units:15,logicalReservations:fs.existsSync(`${output}/token-reservations`)?fs.readdirSync(`${output}/token-reservations`).length:0};
}
export function sealed8(output:string){
  assertSealed6(output);const s=read(`${output}/stage8-seal.json`),run=read(`${output}/run.json`);
  assert.equal(hash(JSON.stringify(verify8(run.previewDirectory))),s.identityHash);
  for(const [file,digest]of Object.entries(s.entries))assert.equal(hash(fs.readFileSync(file)),digest,'Stage8 sealed evidence drift');
}
export function units8(output:string){
  const run=read(`${output}/run.json`);
  return run.config.pilot.flatMap((id:string)=>arms8.map(arm=>{
    const slots=(arm==='B'?['B-extract','B-generate']:[arm]).map(step=>`${id}__${step}`);
    const records=slots.map(slot=>({slot,outcome:fs.existsSync(`${output}/${slot}/outcome8.json`)?read(`${output}/${slot}/outcome8.json`):null,
      reserved:fs.existsSync(`${output}/${slot}/reservation.json`),skipped:fs.existsSync(`${output}/${slot}/skipped.json`)?read(`${output}/${slot}/skipped.json`):null}));
    const file=`${output}/${id}__${arm}.candidate.json`,candidate=fs.existsSync(file)?read(file):null;
    if(candidate)assert(candidate.id===id&&candidate.arm===arm);
    const status=records.find(r=>['UNKNOWN','TIMEOUT','API_ERROR','PROTOCOL_ERROR'].includes(r.outcome?.status))?.outcome.status??
      (candidate?'SUCCESS':records.some(r=>r.skipped?.status==='CANCELLED')?'CANCELLED':records.some(r=>r.reserved&&!r.outcome)?'UNKNOWN':'NOT_EXECUTED');
    const sum=(key:string)=>{const used=records.filter(r=>r.reserved);return used.length&&used.every(r=>typeof r.outcome?.[key]==='number')?used.reduce((s,r)=>s+r.outcome[key],0):null;};
    return {operationId:id,arm,generationStatus:status,records,candidate:candidate?.value??null,
      cost:{logicalCalls:records.filter(r=>r.reserved).length,inputTokens:sum('inputTokens'),outputTokens:sum('outputTokens'),latencyMs:sum('latencyMs'),billableCost:null},
      behavioralAssessment:'NOT_EVALUATED'};
  }));
}
export {terminal6,assertSealed6,boundStudyCoverage,diagnostics6,evaluateStage5Public,httpTransport6};
