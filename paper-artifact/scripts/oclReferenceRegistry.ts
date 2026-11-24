import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as projects from '../src/rm2pt/project';
import type {UseCase} from '../src/rm2pt/model/UseCase';
import {generateContractCode} from '../src/app/util';
import {loadBatchOperations,verifyPreparedBatch} from './lib/rq1Batch114';

export const referenceRoot='data/evaluation/ocl_reference_narrative_v3_v1';
export const referenceResults='results/ocl-reference-narrative-v3-v1';
export const referenceSha=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const referenceRead=(file:string)=>JSON.parse(fs.readFileSync(file,'utf8'));
export function writeReference(file:string,value:unknown){
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2),{flag:'wx'});
}
export function exportSourceReference(id:string){
 const modelFile=`data/narrative_v3_114/generation/models/${id}/typed-model.json`;
 const context=referenceRead(modelFile),op=context.index.operation;
 const project=projects[context.index.project as keyof typeof projects];
 const useCase=(project.useCase as Record<string,UseCase>)[context.index.useCase];
 const source=useCase.relatedService.operations.find(x=>x.name===op.name);assert(source,`Missing source operation ${id}`);
 assert.equal(useCase.relatedService.name,op.service);
 const clauses={definition:source.definition?.trim()||null,precondition:source.precondition,postcondition:source.postcondition};
 assert(typeof clauses.precondition==='string'&&typeof clauses.postcondition==='string');
 const contract=generateContractCode({serviceName:op.service,operationName:op.name,
  parameters:op.parameters.map((p:any)=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,
  ...clauses,definition:clauses.definition??undefined});
 const sourceSignature={parameters:(source.parameters??[]).map(p=>({name:p.name,type:p.type})),returnType:source.returnType?.type};
 return {id,clauses,contract,sourceSignature,modelFile,
  runtimeSource:{file:op.source.file,line:op.source.line,endLine:op.source.endLine,sha256:referenceSha(op.source.file)}};
}
export function prepareReferenceRegistry(){
 verifyPreparedBatch('results/rq1-four-methods-114-v1');
 assert(!fs.existsSync(`${referenceRoot}/manifest.json`),'Reference snapshot already exists; never overwrite frozen references');
 const provenanceFile='data/benchmark/rm2pt_authoritative_114_v4/evaluation-only-provenance.json';
 const provenance=referenceRead(provenanceFile);
 const oracleManifestFile='data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json',oracle=referenceRead(oracleManifestFile);
 const input='data/narrative_v3_114/generation/requirements.jsonl';
 const rows=fs.readFileSync(input,'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
 const records=loadBatchOperations().map(id=>{
  const candidate=exportSourceReference(id),authority=provenance.records.find((r:any)=>r.id===id);assert(authority);
  const requirement=rows.find(r=>r.operationId===id);assert(requirement);
  const test=oracle.records.find((r:any)=>r.id===id);assert(test);
  const decisionFiles=[authority.decision_evidence,authority.additional_owner_v4_decision].filter((x:any)=>typeof x==='string');
  const sourceFiles=[candidate.runtimeSource.file,candidate.modelFile,authority.original_source,test.historical_jest,...decisionFiles];
  const record={...candidate,role:'evaluation-only-source-reference-candidate',referenceKind:'existing-project-source-not-model-output',
   currentNarrative:requirement.description,narrativeSha256:createHash('sha256').update(requirement.description).digest('hex'),
   upstream:authority,sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,referenceSha(file)])),
   oracleFile:test.historical_jest,oracleSha256:referenceSha(test.historical_jest),
   sourceClarificationRequiresAlignment:authority.laboratory_status!=='no-recorded-laboratory-override'||!!authority.additional_owner_v4_decision,
   semanticFidelityCertified:false,referenceVerified:false,referenceSource:'src/rm2pt/project',
   policy:'Keep source clauses unchanged. Do not borrow any generated candidate or weaken Oracle to improve reference similarity.'};
  const file=`${referenceRoot}/candidates/${id}.json`;
  if(fs.existsSync(file))assert.deepEqual(referenceRead(file),record,'Partial export differs; do not overwrite');
  else writeReference(file,record);
  return record;
 });
 const file=`${referenceRoot}/reference-candidates.jsonl`;fs.writeFileSync(file,records.map(r=>JSON.stringify(r)).join('\n')+'\n',{flag:'wx'});
 writeReference(`${referenceRoot}/manifest.json`,{version:'ocl-source-reference-registry-v1',role:'evaluation-only-not-generation-input',
  operations:114,goldReferenceCount:0,semanticFidelityCertified:false,input,inputSha256:referenceSha(input),
  oracleManifestFile,oracleManifestSha256:referenceSha(oracleManifestFile),provenanceFile,provenanceSha256:referenceSha(provenanceFile),
  files:Object.fromEntries([file,...records.map(r=>`${referenceRoot}/candidates/${r.id}.json`),
   'scripts/oclReferenceRegistry.ts','scripts/build_ocl_reference_registry.ts','scripts/evaluate_ocl_reference.ts',
   'scripts/run_ocl_reference_offline.cjs'].map(file=>[file,referenceSha(file)])),
  extraction:'Existing runtime project clauses with frozen operation signature; raw source text retained, no semantic edits',
  clarifyCount:records.filter(r=>r.sourceClarificationRequiresAlignment).length});
 return {candidates:records.length,goldReferenceCount:0,realModelCalls:0};
}
export function verifyReferenceRegistry(){
 const manifest=referenceRead(`${referenceRoot}/manifest.json`);
 assert.equal(referenceSha(manifest.input),manifest.inputSha256);
 assert.equal(referenceSha(manifest.oracleManifestFile),manifest.oracleManifestSha256);
 assert.equal(referenceSha(manifest.provenanceFile),manifest.provenanceSha256);
 for(const [file,digest]of Object.entries(manifest.files))assert.equal(referenceSha(file),digest,`Reference drift ${file}`);
 return manifest;
}
export function referenceSummary(){
 const manifest=verifyReferenceRegistry();
 const rows=loadBatchOperations().map(id=>{
  const candidate=referenceRead(`${referenceRoot}/candidates/${id}.json`),file=`${referenceResults}/records/${id}.json`;
  const result=fs.existsSync(file)?referenceRead(file):null;
  return {id,source:candidate.runtimeSource,sourceClarificationRequiresAlignment:candidate.sourceClarificationRequiresAlignment,
   syntaxValid:result?.syntaxValid??null,preExecValid:result?.preExecValid??null,oracle:result?.oracle??'PENDING',
   eligibleAsValidatedCandidate:result?.oracle==='PASS'&&result?.preExecValid===true,
   eligibleForAutomaticGoldCertification:false,
   status:!result?'PENDING_REPLAY':result.oracle==='PASS'?
    candidate.sourceClarificationRequiresAlignment?'TESTED_PASS_SOURCE_ALIGNMENT_REVIEW':'TESTED_PASS_NOT_SEMANTICALLY_CERTIFIED':
    result.preExecValid?'BEHAVIOR_REFERENCE_REQUIRES_CORRECTION':'LANGUAGE_REFERENCE_REQUIRES_ADAPTATION'};
 });
 const totals={candidates:114,replayed:rows.filter(r=>r.oracle!=='PENDING').length,
  syntaxPassed:rows.filter(r=>r.syntaxValid===true).length,preExecPassed:rows.filter(r=>r.preExecValid===true).length,
  oraclePassed:rows.filter(r=>r.oracle==='PASS').length,oracleFailed:rows.filter(r=>r.oracle==='FAIL').length,
  notEvaluated:rows.filter(r=>r.oracle==='NOT_EVALUATED').length,evaluationErrors:rows.filter(r=>r.oracle==='EVALUATION_ERROR').length,
  clarificationCount:rows.filter(r=>r.sourceClarificationRequiresAlignment).length,certifiedGoldReferences:0};
 const summary={version:manifest.version,totals,rows,realModelCalls:0};
 fs.mkdirSync(referenceResults,{recursive:true});fs.writeFileSync(`${referenceResults}/summary.json`,JSON.stringify(summary,null,2));
 return summary;
}
