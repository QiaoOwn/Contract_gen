import assert from 'node:assert/strict';
import {request8,tokenReservation8} from './lib/contractgenStage8';
import {read} from './lib/m4LiveAdapter';
import {evaluateStage5Public} from './lib/contractgenStage5';
async function main(){
  global.fetch=async()=>{throw Error('Offline test forbids network');};
  const config=read('config/contractgen-stage8-pilot-v1.json');let checked=0;
  for(const id of config.pilot){
    const systems=new Set<string>(),commons=new Set<string>();
    for(const arm of ['A','B','C','D','E']as const){
      const r=request8(id,arm);systems.add(r.messages[0].content);commons.add(r.commonHash);
      tokenReservation8(r.messages,config);
      assert.equal('BehavioralRoles'in r.body,['D','E'].includes(arm));
      assert.equal('K'in r.body,arm==='E');
      const result=await evaluateStage5Public(r.input,r.context,{contract:{definition:null,precondition:'true',postcondition:'true'}});
      assert(result.publicProtocolValid);checked++;
    }
    assert.equal(systems.size,1);assert.equal(commons.size,1);
  }
  console.log(JSON.stringify({checked,realModelCalls:0,paidCalls:0,hiddenJestEvaluations:0}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
