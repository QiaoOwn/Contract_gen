import fs from 'node:fs';
import assert from 'node:assert/strict';
import {prepareFullGuidedV2} from './lib/fullGuidedGenerationV2';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {evaluateContract} from '../src/app/service/evaluateContract';
import {read,save,hash} from './lib/m4LiveAdapter';
import {terminalOracleStatus} from './rq3TerminalStatus';

async function main(){
 const [source,output,...extra]=process.argv.slice(2);assert(extra.length===0||(extra.length===1&&extra[0]==='--fixture'),'Only explicit --fixture is supported after paths');
 const fixture=extra.includes('--fixture');assert(source&&output&&!fs.existsSync(output),'Completed repair source and fresh output required');
 globalThis.fetch=async()=>{throw Error('Terminal evaluation forbids network');};
 const summary=read(`${source}/summary.json`),identity=read(`${source}/identity.json`),result=read(`${source}/result.json`);
 assert(result.stop===summary.stop);
 if(fixture)assert(summary.mock===true&&summary.fixture===true&&identity.fixture===true,'Explicitly labelled fixture files required');
 else assert(summary.mock===false&&!summary.fixture&&!identity.fixture,'Mock/fixture is not a real repair result');
 for(const [p,h]of Object.entries(identity.files))assert.equal(hash(fs.readFileSync(p)),h);
 const protectedFiles=Object.fromEntries(['summary.json','identity.json','result.json'].map(n=>[`${source}/${n}`,hash(fs.readFileSync(`${source}/${n}`))]));
 const manifestFile='data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json',manifest=read(manifestFile),oracle=manifest.records.find((r:any)=>r.id===identity.operationId);assert(oracle);assert.equal(hash(fs.readFileSync(oracle.historical_jest)),oracle.jest_sha256);
 save(`${output}/reservation.json`,{source,protectedFiles,oracleHash:oracle.jest_sha256,feedbackAllowed:false,fixture,eligibleForExperimentalStatistics:!fixture});
 const jestConfig=require('jest-config'),originalConfig=jestConfig.readInitialOptions;
 jestConfig.readInitialOptions=async(...values:any[])=>{const r=await originalConfig(...values);return {...r,config:{...r.config,collectCoverage:false,coverageDirectory:`${output}/coverage`,cacheDirectory:`${output}/cache`,modulePathIgnorePatterns:['<rootDir>/results/','<rootDir>/tmp/']}};};
 const p=prepareFullGuidedV2(identity.operationId),last=result.events.filter((e:any)=>e.candidate).at(-1);
 const candidates=[{kind:'initial-no-repair',contract:identity.initial},{kind:'method-final',contract:result.candidate},...(last?[{kind:'last-proposal',contract:last.candidate}]:[])];
 const records=[];for(const c of candidates){const common=await evaluateStage5Public(p.request.loaded.input,p.request.loaded.context,{contract:c.contract});let behavior:any=null,evaluationError:unknown=null;
  if(common.publicProtocolValid&&common.evaluation?.preExecValid){const context=p.request.loaded.context;try{behavior=await evaluateContract({project:context.index.project,useCase:context.index.useCase,operation:context.index.operation.name,contract:common.evaluation.contract,ocl:c.contract,generatedSubsetValidation:true,oracleProfile:'rm2pt-authoritative-preparation-v4'} as any);}catch(e){evaluationError=String(e);}}
  save(`${output}/${c.kind}.json`,{common,behavior,evaluationError});records.push({kind:c.kind,preExec:common.evaluation?.preExecValid??false,oracle:terminalOracleStatus(behavior,evaluationError),passing:behavior?.test_passing_count??null,failing:behavior?.test_failing_count??null});
 }
 for(const [p,h]of Object.entries(protectedFiles))assert.equal(hash(fs.readFileSync(p)),h);assert.equal(hash(fs.readFileSync(oracle.historical_jest)),oracle.jest_sha256);
 for(const [p,h]of Object.entries(identity.files))assert.equal(hash(fs.readFileSync(p)),h,'Frozen input/backend changed during terminal evaluation');
 save(`${output}/summary.json`,{source,records,newModelCalls:0,paidCalls:0,feedbackAllowed:false,fixture,eligibleForExperimentalStatistics:!fixture,formalExperimentReady:false});console.log(records);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
