import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rq1Request} from './rq1NarrativeComparisons';
import {prepareStage5Arm} from './contractgenStage5';
import {enhanceFullRequestV2} from './fullGuidedGenerationV2';
import {hash,read} from './m4LiveAdapter';
import {ccHash} from '../../src/app/service/crossClauseGraph';
import {compileFullGenerationDecisionPlan} from '../../src/app/service/fullGenerationDecisionPlan';

export function prepareSourceRevisedRequest(id:string,manifestPath:string,method:'direct'|'full') {
 const m=read(manifestPath);
 assert.equal(m.version,'narrative-source-revision-v1');
 for(const [f,h]of [[m.baseFile,m.baseSha256],[m.revisionFile,m.revisionSha256],[m.sourceFile,m.sourceSha256]])
  assert.equal(hash(fs.readFileSync(f)),h,`Source revision drift: ${f}`);
 assert(m.affectedOperations.includes(id),'Operation not declared in revision');
 const rows=(f:string)=>fs.readFileSync(f,'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
 const baseline=rows(m.baseFile),revised=rows(m.revisionFile);
 assert.equal(baseline.length,114);assert.equal(revised.length,114);
 assert.equal(new Set(revised.map(r=>r.operationId)).size,114);
 const changed:string[]=[];
 for(let i=0;i<baseline.length;i++){
  assert.equal(revised[i].operationId,baseline[i].operationId);
  if(ccHash(revised[i])!==ccHash(baseline[i]))changed.push(revised[i].operationId);
 }
 assert.deepEqual(changed,[...m.affectedOperations]);
 const old=rq1Request(id,method),row=revised.find(r=>r.operationId===id);
 const change=m.changes.find((c:any)=>c.operationId===id);assert(change);
 assert.equal(change.beforeSourceHash,old.loaded.input.sourceHash);
 assert.equal(change.afterSourceHash,ccHash(row.description));
 const input={...old.loaded.input,narrativeRequirement:row.description,sourceHash:ccHash(row.description)};
 const base=prepareStage5Arm(input,old.loaded.context,method==='full'?'E':'A');
 const body={...base.body,...(method==='full'?{BehavioralRoles:base.prepared.sections.BehavioralRoleMapping}:{})};
 if(method==='full')delete (body as any).TargetLanguage;
 const messages=[old.messages[0],{role:'user',content:JSON.stringify(body)}];
 const revisedRequest={...old,loaded:{...old.loaded,row,input,datasetSha256:m.revisionSha256},base,messages,
  hash:hash(JSON.stringify({messages,extraction:old.extraction,clauseRequests:old.clauseRequests}))};
 // Direct still receives only the common narrative/signature/UML/output protocol, never the compiled decision plan.
 const result=method==='full'?enhanceFullRequestV2(revisedRequest):{
  version:'source-revised-direct-v2',request:revisedRequest,requestHash:revisedRequest.hash,baseRequestHash:old.hash,
  decisions:compileFullGenerationDecisionPlan(input,base.prepared,old.loaded.context),
  characters:{baseline:JSON.stringify(old.messages).length,enhanced:JSON.stringify(messages).length},
  immutable:{planHash:base.prepared.Tn.planHash,modelHash:base.prepared.fullModelHash,rulesShared:false,
   sharedLanguageVersion:base.common.TargetLanguage.version,sharedLanguageHash:base.common.TargetLanguage.sha256,referenceAccess:false,oracleAccess:false}};
 return {...result,revisionManifest:manifestPath,revisionVersion:m.revisionVersion};
}
