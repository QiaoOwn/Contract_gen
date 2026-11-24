import fs from 'node:fs';
import assert from 'node:assert/strict';
import {digestFile} from './lib/rq1Batch114';

const root='results/rq2-validation-narrative-v1';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const normalize=(s:any)=>{const {capturedNowMillis,...state}=s;return state;};
for(const file of [`${root}/manifest.json`,`${root}/mutation-pilot-v1/seal.json`,`${root}/mutation-boundaries-v1/seal.json`,`${root}/extended-v1/seal.json`,`${root}/purity-v1/source-seal.json`]){
 for(const [p,h]of Object.entries(read(file).files))assert.equal(digestFile(p),h,`Frozen drift: ${p}`);
}
const extended=read(`${root}/extended-v1/replay-summary.json`);assert(extended.complete);
const extendedPlan=read(`${root}/extended-v1/plan.json`);
const verified=[];
for(const r of extended.records){
 const dir=`${root}/extended-v1/replay/${r.id}`;
 const enabled=read(`${dir}/enabled/result.json`),disabled=read(`${dir}/disabled/result.json`);
 assert.deepEqual(normalize(enabled.before),normalize(disabled.before));assert.deepEqual(normalize(enabled.after),normalize(disabled.after));
 assert.equal(disabled.decision,true);
 if(r.control){assert.equal(enabled.decision,true);}else{
  const m=extendedPlan.mutations.find((m:any)=>m.mutation_id===r.id);assert(m);assert.equal(digestFile(m.captureFile),m.captureSha256);
  const control=extended.records.find((c:any)=>c.control&&c.operationId===r.operationId&&read(`${root}/extended-v1/replay/${c.id}/disabled/result.json`).source_capture_index===m.source_capture_index);assert(control);
  const correct=read(`${root}/extended-v1/replay/${control.id}/disabled/result.json`);
  assert.deepEqual(normalize(correct.before),normalize(disabled.before));
  assert.notDeepEqual(normalize(correct.after),normalize(disabled.after),'Mutation did not change control outcome');
 }
 verified.push({id:r.id,control:r.control,detected:r.detected,error:r.error});
}
const pilot=read(`${root}/mutation-pilot-v1/summary.json`),boundary=read(`${root}/mutation-boundaries-v1/summary.json`),correction=read(`${root}/loan-target-correction-v1/summary.json`),pure=read(`${root}/purity-v1/summary.json`),captures=read(`${root}/extended-v1/capture-summary.json`);
assert(pilot.complete&&boundary.complete&&captures.complete);assert.equal(correction.records.length,2);
const allFaults=[...pilot.records.filter((r:any)=>!r.control).map((r:any)=>({detected:r.enabled.decision===false&&r.disabled.decision===true})),...boundary.records.map((r:any)=>({detected:r.detected})),{detected:correction.records[0].decision===false&&correction.records[1].decision===true},...extended.records.filter((r:any)=>!r.control).map((r:any)=>({detected:r.detected}))];
const controls=[...pilot.records.filter((r:any)=>r.control).map((r:any)=>({accepted:r.enabled.decision===true&&r.disabled.decision===true})),...extended.records.filter((r:any)=>r.control).map((r:any)=>({accepted:r.enabled===true&&r.disabled===true}))];
const pairs=pure.dynamic.reduce((n:number,r:any)=>n+r.pairs,0)+captures.records.reduce((n:number,r:any)=>n+r.checkerPairs,0);
const natural=read(`${root}/summary.json`);
const summary={
 scope:'Frozen current Contract Gen candidates; controlled post-state faults; no fresh LLM generation',
 naturalCandidates:{operations:natural.operations,syntaxPassed:natural.syntax,preExecPassed:natural.preExec,behaviorPassed:natural.behavior,parserBlocked:natural.boundaries.parser,typeScriptBlocked:natural.boundaries.typescript,behaviorScenarioFailed:natural.boundaries['behavior-scenario-fail']},
 faultReplay:{operations:8,injectedScenarioTrials:allFaults.length,detected:allFaults.filter(r=>r.detected).length,notDetected:allFaults.filter(r=>!r.detected).length,controls:controls.length,controlsAccepted:controls.filter(r=>r.accepted).length,localExecutions:2*(allFaults.length+controls.length),note:'Includes retained neighbor-frame mutation; repeated fault definitions across snapshots are not independent operators'},
 staticCheckerAudit:pure.counts,
 dynamicCheckerObservation:{operations:8,checkerBoundaryPairs:pairs,unchangedPairs:pairs,oracleTests:pure.dynamic.reduce((n:number,r:any)=>n+r.tests.total,0)+captures.records.reduce((n:number,r:any)=>n+r.tests.total,0)},
 extendedReplayIndependentVerification:verified,
 realModelCalls:0,paidCalls:0,formalExperimentReady:false,
 evidence:['summary.json','mutation-pilot-v1/summary.json','mutation-boundaries-v1/summary.json','loan-target-correction-v1/summary.json','purity-v1/summary.json','extended-v1/replay-summary.json','extended-v1/capture-summary.json'],
};
assert.equal(summary.faultReplay.injectedScenarioTrials,25);assert.equal(summary.faultReplay.localExecutions,68);assert.equal(pairs,31);
fs.writeFileSync(`${root}/RQ2_FINAL_STATISTICS.json`,JSON.stringify(summary,null,2));console.log(summary);
