import fs from 'node:fs';
import assert from 'node:assert/strict';
import {referenceRoot,referenceResults,referenceRead,referenceSha,writeReference,verifyReferenceRegistry} from './oclReferenceRegistry';
import {loadNarrativeOperation} from '../src/app/service/narrativeOperationInput';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {evaluateContract} from '../src/app/service/evaluateContract';

async function main(){
 const id=process.argv[2];assert(id&&/^[A-Za-z0-9_]+$/.test(id));verifyReferenceRegistry();
 const file=`${referenceResults}/records/${id}.json`;assert(!fs.existsSync(file),'Fresh reference result required');
 const record=referenceRead(`${referenceRoot}/candidates/${id}.json`);
 for(const [source,digest]of Object.entries(record.sourceFiles))assert.equal(referenceSha(source),digest);
 global.fetch=async()=>{throw Error('Reference replay is offline; network forbidden');};
 const context=referenceRead(record.modelFile);
 const loaded=loadNarrativeOperation({project:context.index.project,useCase:context.index.useCase,operation:context.index.operation.name});
 assert.equal(loaded.input.narrativeRequirement,record.currentNarrative);
 let common:any=null,behavior:any=null,error:string|null=null;
 try{
  common=await evaluateStage5Public(loaded.input,loaded.context,{contract:record.clauses});
  if(common.publicProtocolValid&&common.evaluation?.preExecValid){
   behavior=await evaluateContract({project:context.index.project,useCase:context.index.useCase,operation:context.index.operation.name,
    contract:common.evaluation.contract,ocl:record.clauses,generatedSubsetValidation:true,oracleProfile:'rm2pt-authoritative-preparation-v4'});
  }
 }catch(e){error=String(e);}
 const oracle=error?'EVALUATION_ERROR':!behavior?'NOT_EVALUATED':behavior.test_execution_ok?'PASS':
  (behavior.test_passing_count??0)+(behavior.test_failing_count??0)>0?'FAIL':'EVALUATION_ERROR';
 for(const [source,digest]of Object.entries(record.sourceFiles))assert.equal(referenceSha(source),digest);
 writeReference(file,{operationId:id,referenceCandidateSha256:referenceSha(`${referenceRoot}/candidates/${id}.json`),
  syntaxValid:common?.evaluation?.syntaxValid??false,preExecValid:common?.evaluation?.preExecValid??false,
  oracle,passedTests:behavior?.test_passing_count??null,failedTests:behavior?.test_failing_count??null,
  diagnostics:common?.evaluation?.stages??null,behavior,error,semanticFidelityCertified:false,realModelCalls:0});
 console.log(JSON.stringify({id,oracle,realModelCalls:0}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
