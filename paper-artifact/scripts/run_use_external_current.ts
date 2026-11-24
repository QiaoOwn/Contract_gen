import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parse as dotenv} from 'dotenv';
import {prepareUseCurrent,useRows,USE_ROOT,USE_ADAPTER} from './lib/useExternalCurrent';
import {hash,save,read} from './lib/m4LiveAdapter';
import {reserved6} from './lib/contractgenStage6';
import {tokenReservation8,responseModelAccepted8} from './lib/contractgenStage8';
import {legacyUrllibTransport} from './lib/legacyUrllibTransport';
import {configureExperimentProxy} from './lib/experimentProxy';
import {normalizeRq1Output} from './lib/rq1OutputNormalization';
import {stage5PublicSchema} from './lib/contractgenStage5';
import {randomUUID} from 'node:crypto';

function checkpoint(file:string,value:unknown){
 const temporary=`${file}.${randomUUID()}.tmp`;
 fs.writeFileSync(temporary,JSON.stringify(value,null,2),{flag:'wx'});
 fs.renameSync(temporary,file);
}

async function main(){
 const args=process.argv.slice(2),flags=new Set(['--execute-paid']);
 for(let i=0;i<args.length;i++){assert(['--mode','--output','--preview','--operation-id','--limit','--execute-paid'].includes(args[i]),`Unknown argument ${args[i]}`);if(!flags.has(args[i])){assert(args[i+1]&&!args[i+1].startsWith('--'));i++;}}
 const get=(k:string,d='')=>args.includes(k)?args[args.indexOf(k)+1]:d;
 const mode=get('--mode','preview'),output=get('--output','results/use20-current-preview-v1');
 assert(['preview','mock','run'].includes(mode));assert(!fs.existsSync(output),'Fresh output required; never overwrite a paid reservation');
 assert(!args.includes('--execute-paid')||mode==='run');if(mode==='run')assert(args.includes('--execute-paid'),'Explicit paid execution flag required');
 else globalThis.fetch=async()=>{throw Error('Offline mode forbids model access');};
 const config=read('config/contractgen-stage8-pilot-v1.json');assert.equal(config.sampling.model,'gpt-5.5');
 const all=useRows();assert.equal(all.length,20);assert.equal(new Set(all.map(r=>r.id)).size,20);
 const files:Record<string,string>={};
 const freeze=(f:string)=>{if(fs.statSync(f).isDirectory()){for(const name of fs.readdirSync(f))freeze(path.join(f,name));}else files[f]=hash(fs.readFileSync(f));};
 for(const f of ['src/app','src/rm2pt/model','public','antlr4','config',`${USE_ROOT}/generation-inputs.jsonl`,`${USE_ROOT}/evaluation/runtime`,
  'scripts/lib/useExternalCurrent.ts','scripts/lib/fullGuidedGenerationV2.ts','scripts/lib/contractgenStage5.ts','scripts/lib/narrativeStage3.ts',
  'scripts/lib/legacyUrllibTransport.ts','scripts/lib/contractgenStage6.ts','scripts/lib/contractgenStage8.ts','scripts/lib/urllib_model_transport.py',
  'scripts/lib/rq1OutputNormalization.ts','scripts/run_use_external_current.ts','scripts/validate_use_external_candidates.ts','scripts/evaluate_use_external_hidden_candidates.ts'])freeze(f);
 const verify=()=>{for(const [f,h]of Object.entries(files))assert.equal(hash(fs.readFileSync(f)),h,`Source changed: ${f}`);};
 if(mode==='preview'){
  fs.mkdirSync(output,{recursive:true});const records=[];
  for(const row of all){
   const p=prepareUseCurrent(row),messages=p.messages,requestHash=hash(JSON.stringify(messages));
   assert.equal(p.input.narrativeRequirement,row.description);
   const directory=`${output}/operations/${row.id}`;
   save(`${directory}/request.json`,messages);
   save(`${directory}/compiled.json`,{input:p.input,context:p.context,Tn:p.prepared.Tn,B:p.prepared.RoleMapping,R:p.prepared.R,K:p.prepared.K,
    decisions:p.enhanced.decisions,sourceIdentity:p.sourceIdentity});
   const budget=tokenReservation8(messages,config);save(`${directory}/budget.json`,budget);
   records.push({operationId:row.id,requestHash,planHash:p.prepared.Tn.planHash,sourceHash:p.input.sourceHash,
    requestCharacters:JSON.stringify(messages).length,unresolved:p.prepared.Tn.unresolved.length});
  }
  verify();save(`${output}/manifest.json`,{version:'use20-current-full-v2',model:'gpt-5.5',config,files,records,
   maximumLogicalCalls:20,callsPerOperation:1,firstGenerationOnly:true,repairEnabled:false,
   narrativeOrigin:'Frozen USE-20 description, including its existing explicit postcondition labels',
   compiler:'Narrative Compiler V4',generation:'Full guided generation V2',realModelCalls:0,paidCalls:0});
  console.log({mode,operations:records.length,realModelCalls:0,paidCalls:0,output});return;
 }
 const preview=get('--preview','results/use20-current-preview-v1'),manifest=read(`${preview}/manifest.json`);
 assert.equal(manifest.version,'use20-current-full-v2');assert.deepEqual(manifest.config,config);
 assert.deepEqual(manifest.files,files,'Preview source/model/Oracle differs from current project');verify();
 const id=get('--operation-id'),limit=Number(get('--limit','1'));assert(Number.isInteger(limit)&&limit>=1&&limit<=20);
 const selected=(id?manifest.records.filter((r:any)=>r.operationId===id):manifest.records).slice(0,limit);assert(selected.length);
 fs.mkdirSync(output,{recursive:true});save(`${output}/identity.json`,{preview,manifestHash:hash(fs.readFileSync(`${preview}/manifest.json`)),mode,selected,maximumLogicalCalls:selected.length});
 const environment={...(fs.existsSync('.env')?dotenv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?dotenv(fs.readFileSync('.env.local')):{}),...process.env};
 const network=mode==='run'?await configureExperimentProxy(environment):{source:'mock',automaticRetries:0};save(`${output}/network.json`,network);
 let transport:ReturnType<typeof legacyUrllibTransport>|undefined;
 if(mode==='run'){
  const endpoint=environment.OPENAI_BASE_URL,key=environment.OPENAI_API_KEY||environment.API_KEY;assert(endpoint&&key);
  const url=new URL(endpoint);assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash);
  transport=legacyUrllibTransport(endpoint,key,config.sampling,'proxy'in network?network.proxy:null,environment.CONTRACTGEN_PYTHON||'python');
 }
 const records:any[]=[];let realModelCalls=0,stop:string|null=null;
 for(const record of selected){
  const directory=`${output}/operations/${record.operationId}`;const messages=read(`${preview}/operations/${record.operationId}/request.json`);
  assert.equal(hash(JSON.stringify(messages)),record.requestHash);verify();
  save(`${directory}/run.json`,{slots:['generation__1'],mock:mode==='mock',maximumNewCalls:1});
  try{
   const value=await reserved6(directory,'generation__1',messages,record.requestHash,async m=>{
    if(mode==='mock')return {content:JSON.stringify({contract:{definition:null,precondition:'true',postcondition:'true'}}),raw:{mock:true},model:'gpt-5.5',inputTokens:null,outputTokens:null,reasoningTokens:null,finishReason:'stop'};
    realModelCalls++;return transport!(m);
   });
   const response=read(`${directory}/generation__1/raw-response.json`);
   verify();assert(mode==='mock'||responseModelAccepted8(config,response.raw?.body?.model),'Unexpected model; response preserved');
   const normalized=normalizeRq1Output(value,'contract');save(`${directory}/normalization.json`,normalized);
   const parsed=stage5PublicSchema.safeParse(normalized.normalized);
   if(!parsed.success){save(`${directory}/protocol-error.json`,parsed.error.issues);records.push({operationId:record.operationId,protocolValid:false});continue;}
   const candidate={operation_id:record.operationId,model:'gpt-5.5',attempt:1,...parsed.data.contract};
   fs.writeFileSync(`${directory}/candidates.jsonl`,JSON.stringify(candidate)+'\n');
   if(mode==='run'){
    // Terminal evaluation runs after generation; its output is never added to a model request.
    for(const [script,folder]of [['scripts/validate_use_external_candidates.ts','preexec'],['scripts/evaluate_use_external_hidden_candidates.ts','terminal']]){
     execFileSync(process.execPath,['--import','tsx',script,'--candidates',`${directory}/candidates.jsonl`,'--output-dir',`${directory}/${folder}`],{stdio:'pipe',windowsHide:true,timeout:600000});
    }
   }
   records.push({operationId:record.operationId,protocolValid:true,mock:mode==='mock',evaluation:mode==='mock'?'NOT_EVALUATED':'TERMINAL_RECORDED',directory});
  }catch(e){stop=String(e);save(`${directory}/stop.json`,{stop,callMayBeBilled:mode==='run',automaticRetries:0});break;}
  finally{checkpoint(`${output}/summary.json`,{records,stop,realModelCalls,paidCalls:realModelCalls,firstGenerationOnly:true,repairEnabled:false});}
 }
 console.log({mode,completed:records.length,stop,realModelCalls,output});
 if(stop)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
