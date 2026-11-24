import assert from 'node:assert/strict';
import {tables8} from './lib/contractgenStage8Statistics';
const results=['one','two','three'].flatMap(operationId=>['A','B','C','D','E'].map(arm=>({operationId,arm,behavioralPass:null,diagnostics:{business:[{id:'CG-OMISSION',observations:operationId==='one'?[{verdict:arm==='A'?'witnessed-violation':'witnessed-satisfied',evidence:['synthetic statistics witness, not model performance']}]:[]}]}})));
const t=tables8({results,kind:'MOCK_INTERFACE_ONLY'});
assert(t.tableA.every(r=>r.rateAmongKnown===null));assert.equal(t.tableB[0].deltaOmission.delta,-1);
assert.equal(t.tableB[0].deltaOmission.pairedKnown,1);assert.equal(t.tableC[0].categories[0].assessed,1);
assert.equal(t.tableC[0].categories[0].notAssessed,2);assert.throws(()=>tables8({results:results.slice(1),kind:'MOCK_INTERFACE_ONLY'}));
console.log(JSON.stringify({passed:6,fixtureOnly:true,paidCalls:0}));
