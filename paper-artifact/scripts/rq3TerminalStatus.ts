export function terminalOracleStatus(behavior:any,error?:unknown){
 if(error)return 'EVALUATION_ERROR';
 if(!behavior)return 'NOT_EVALUATED';
 const passed=Number(behavior.test_passing_count??0),failed=Number(behavior.test_failing_count??0);
 if(!Number.isFinite(passed)||!Number.isFinite(failed)||passed<0||failed<0)return 'EVALUATION_ERROR';
 if(behavior.test_execution_ok===true&&passed>0&&failed===0)return 'PASS';
 if(failed>0)return 'FAIL';
 return 'EVALUATION_ERROR';
}
