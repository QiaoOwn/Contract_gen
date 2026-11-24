import {sealed8,units8,terminal6,evaluateStage5Public,diagnostics6,boundStudyCoverage,verify8} from './contractgenStage8';
import {read} from './m4LiveAdapter';
import {inputs6} from './contractgenStage6';

export async function evaluate8(directory:string){
  sealed8(directory);
  const run=read(`${directory}/run.json`),identity=verify8(run.previewDirectory);
  const coverage=boundStudyCoverage(identity);
  return terminal6(directory,async()=>{
    const results=[];
    for(const unit of units8(directory)){
      if(!unit.candidate){results.push({...unit,behavioralPass:null,evaluationStatus:'NOT_EVALUATED'});continue;}
      const {input,context}=inputs6(unit.operationId);
      const common=await evaluateStage5Public(input,context,unit.candidate);
      let oracle:any=null;
      if(common.publicProtocolValid&&common.evaluation?.preExecValid){
        const {evaluateContract}=await import('../../src/app/service/evaluateContract');
        oracle=await evaluateContract({project:context.index.project,useCase:context.index.useCase,operation:context.index.operation.name,
          contract:common.evaluation.contract,ocl:unit.candidate.contract,generatedSubsetValidation:true,oracleProfile:'rm2pt-authoritative-preparation-v4'});
      }
      results.push({...unit,common,diagnostics:diagnostics6(common),oracle,
        coverage:coverage.operations.find((r:any)=>r.id===unit.operationId),
        postCheckAssessment:oracle?.test_execution_ok?'integrated-finite-scenario-pass':'NOT_ASSESSED',
        behavioralPass:oracle?oracle.test_execution_ok===true:common.publicProtocolValid&&common.evaluation?.preExecValid?null:false,
        formalExperimentReady:false});
    }
    return {results,kind:run.mock?'MOCK_INTERFACE_ONLY':'PREPARATORY_REAL_GENERATION',feedbackToGeneration:false};
  });
}
