import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rq1Methods,rq1Request} from './lib/rq1NarrativeComparisons';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {evaluateContract} from '../src/app/service/evaluateContract';
import {hash,read,save} from './lib/m4LiveAdapter';
import {prepareSourceRevisedRequest} from './lib/sourceRevisedGeneration';
async function main(){
 const [source,out]=process.argv.slice(2);assert(source&&out&&!fs.existsSync(out),'Sealed source and fresh output required');
 global.fetch=async()=>{throw Error('Offline terminal evaluation forbids network');};
 const seal=read(`${source}/generation-seal.json`),run=read(`${source}/run.json`),summary=read(`${source}/summary.json`);
 const verify=()=>{for(const [file,digest]of Object.entries(seal.entries))assert.equal(hash(fs.readFileSync(file)),digest,'Sealed evidence changed');};verify();
 const identity=read(`${run.preview}/identity.json`);assert.equal(hash(JSON.stringify(identity)),run.identityHash);
 const manifest='data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json',record=read(manifest).records.find((r:any)=>r.id===identity.operationId);assert(record);
 assert.equal(hash(fs.readFileSync(record.historical_jest)),record.jest_sha256);
 const revisionFiles=identity.sourceRevision?[identity.sourceRevision,read(identity.sourceRevision).revisionFile]:[];
 const protectedHashes=Object.fromEntries([manifest,record.historical_jest,`${source}/summary.json`,...revisionFiles].map(f=>[f,hash(fs.readFileSync(f))]));
 save(`${out}/evaluation-reservation.json`,{source,identityHash:run.identityHash,protectedHashes,feedbackAllowed:false});
 const results=[];
 for(const method of rq1Methods){
  const generation=summary.results.find((r:any)=>r.method===method),file=`${source}/${method}.candidate.json`;
  if(!fs.existsSync(file)){results.push({method,generationStatus:generation?.status??'NOT_EXECUTED',preExec:null,oracle:'NOT_EVALUATED',behaviorPassed:null});continue;}
  const saved=read(file);assert(saved.method===method&&saved.operationId===identity.operationId);
  if(identity.sourceRevision)assert(method==='direct'||method==='full');
  const r=identity.sourceRevision?prepareSourceRevisedRequest(identity.operationId,identity.sourceRevision,method as 'direct'|'full').request:rq1Request(identity.operationId,method);
  const common=await evaluateStage5Public(r.loaded.input,r.loaded.context,saved.candidate);
  let oracle:any=null;
  if(common.publicProtocolValid&&common.evaluation?.preExecValid){const c=r.loaded.context;
   oracle=await evaluateContract({project:c.index.project as Parameters<typeof evaluateContract>[0]['project'],useCase:c.index.useCase,operation:c.index.operation.name,
    contract:common.evaluation.contract,ocl:saved.candidate.contract,generatedSubsetValidation:true,oracleProfile:'rm2pt-authoritative-preparation-v4'});
  }
  save(`${out}/${method}.json`,{generation,rawCandidateFile:file,formatAudit:saved.formatAudit,common,oracle});
  const oracleStatus=oracle?(oracle.test_execution_ok?'PASS':
    (oracle.test_passing_count??0)+(oracle.test_failing_count??0)>0?'FAIL':'EVALUATION_ERROR'):'NOT_EVALUATED';
  results.push({method,generationStatus:generation?.status,protocolValid:common.publicProtocolValid,preExec:common.evaluation?.preExecValid??false,
   oracle:oracleStatus,behaviorPassed:oracleStatus==='PASS'?true:oracleStatus==='FAIL'?false:null,
   passing:oracle?.test_passing_count??null,failing:oracle?.test_failing_count??null});
 }
 verify();for(const [file,digest]of Object.entries(protectedHashes))assert.equal(hash(fs.readFileSync(file)),digest);
 save(`${out}/summary.json`,{operationId:identity.operationId,source,sourceRevision:identity.sourceRevision??null,results,originalGenerationCalls:summary.realModelCalls,newModelCalls:0,paidCalls:0,
  formalExperimentReady:false,scope:'Finite frozen Oracle scenarios; not universal semantic equivalence',generationEvidenceUnchanged:true});
 console.log(JSON.stringify({results,newModelCalls:0,output:out}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
