import fs from 'node:fs';
import assert from 'node:assert/strict';
import {verifyPreparedBatch,validateCompletedRun,readBatchJson as read,digestFile} from './lib/rq1Batch114';
import {hash,save} from './lib/m4LiveAdapter';

const root=process.argv[2]??'results/rq2-validation-narrative-v1';
assert(!fs.existsSync(root),'Fresh validation output required');
globalThis.fetch=async()=>{throw Error('Validation preparation forbids network');};
const parent='results/rq1-four-methods-114-v1',plan=verifyPreparedBatch(parent);
const narrative='data/narrative_v3_114/generation/requirements.jsonl';
const source=new Map<string,any>(fs.readFileSync(narrative,'utf8').trim().split(/\r?\n/).map(line=>{const r=JSON.parse(line);return [r.operationId,r];}));
const oracleManifest='data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json';
const oracles=read(oracleManifest);const files:Record<string,string>={[narrative]:digestFile(narrative),[oracleManifest]:digestFile(oracleManifest),...plan.files};
const candidates:any[]=[],operations:any[]=[],stages:any[]=[];
for(const id of plan.operations){
 const run=`${parent}/runs/${id}/full`,oracle=`${parent}/oracle/${id}/full`;
 validateCompletedRun(run,id,'full');Object.assign(files,read(`${run}/generation-seal.json`).entries);
 for(const file of [`${run}/summary.json`,`${run}/generation-seal.json`,`${oracle}/summary.json`])files[file]=digestFile(file);
 const candidateFile=`${run}/full.candidate.json`,candidate=read(candidateFile),evaluation=candidate.evaluation.evaluation;
 const result=read(`${oracle}/summary.json`);assert.equal(result.operationId,id);assert.equal(result.source,run);assert.equal(result.newModelCalls,0);
 const behavioral=result.results.find((r:any)=>r.method==='full');assert(behavioral);
 const modelFile=`data/narrative_v3_114/generation/models/${id}/typed-model.json`,model=read(modelFile);
 files[modelFile]=digestFile(modelFile);const spec=source.get(id);assert(spec);
 const mapped=oracles.records.find((r:any)=>r.id===id);assert(mapped);assert.equal(digestFile(mapped.historical_jest),mapped.jest_sha256);
 files[mapped.historical_jest]=mapped.jest_sha256;
 const record={operation_id:id,model:'gpt-5.5',attempt:1,contract:evaluation.contract,contract_sha256:hash(evaluation.contract),
  syntax_valid:evaluation.syntaxValid,preexec_valid:evaluation.preExecValid,behavior_passed:behavioral.behaviorPassed,
  oracle_status:behavioral.oracle,source_candidate:candidateFile,source_generation:run,source_evaluation:oracle,oracle_test:mapped.historical_jest};
 assert.equal(typeof record.contract,'string');assert.equal(behavioral.preExec,evaluation.preExecValid);
 candidates.push(record);
 operations.push({id,project:model.index.project,useCase:model.index.useCase,operation_name:model.index.operation.name,
  description:spec.description,requirementVersion:spec.requirementVersion,sourceType:spec.sourceType,
  sourceNarrativeFile:narrative,sourceNarrativeHash:hash(spec.description),typedModelFile:modelFile});
 const firstFailure=evaluation.stages?.find((s:any)=>s.status==='FAIL');
 const boundary=!evaluation.syntaxValid?'parser':!evaluation.preExecValid?(firstFailure?.stage??'preexec-unlocalized'):
  behavioral.behaviorPassed===true?'behavior-pass':behavioral.oracle==='FAIL'?'behavior-scenario-fail':'evaluation-unresolved';
 stages.push({operationId:id,syntax:evaluation.syntaxValid,preExec:evaluation.preExecValid,behavior:behavioral.behaviorPassed,
  oracle:behavioral.oracle,passingScenarios:behavioral.passing,failingScenarios:behavioral.failing,
  firstBlockingBoundary:boundary,recordedStages:evaluation.stages,diagnosticEvidence:firstFailure?.evidence??[],
  semanticRootCause:'not-inferred-from-stage-status',sourceCandidate:candidateFile});
}
assert.equal(candidates.length,114);assert.equal(new Set(candidates.map(r=>r.operation_id)).size,114);
fs.mkdirSync(root,{recursive:true});
for(const [name,rows]of [['candidates',candidates],['operations',operations]] as const)fs.writeFileSync(`${root}/${name}.jsonl`,rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
save(`${root}/stage-records.json`,stages);
const count=(key:string)=>stages.filter(r=>r[key]===true).length;
const boundaries=Object.fromEntries([...new Set(stages.map(r=>r.firstBlockingBoundary))].map(k=>[k,stages.filter(r=>r.firstBlockingBoundary===k).length]));
const summary={version:'rq2-narrative-validation-cohort-v1',operations:114,syntax:count('syntax'),preExec:count('preExec'),behavior:count('behavior'),boundaries,
  interpretation:'Recorded stage outcomes on current first-generation Contract Gen candidates; not independently adjudicated fault-detection precision.',
  formalExperimentReady:false,realModelCalls:0,paidCalls:0,referenceContractsUsed:false};
save(`${root}/summary.json`,summary);
for(const name of ['candidates.jsonl','operations.jsonl','stage-records.json','summary.json'])files[`${root}/${name}`]=digestFile(`${root}/${name}`);
for(const f of ['scripts/prepare_rq2_validation_cohort.ts','scripts/run_rq2_validation_capture.ts','scripts/rq2_validation_capture_offline.cjs','scripts/capture-semantic-operation.ts'])files[f]=digestFile(f);
save(`${root}/manifest.json`,{files,sourceRoot:parent,sourceGeneration:'full-guided-generation-v2',requirementInput:'Narrative-V3',compiler:'Narrative-V4',oracleManifest,
  policy:'Read-only current candidates. Operation rows are a capture-interface view of unchanged narrative/model declarations, not Structured-Gold input.'});
console.log({...summary,root});
