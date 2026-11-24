import fs from 'node:fs';
import assert from 'node:assert/strict';
import {request8,arms8} from './lib/contractgenStage8';
import {read,save} from './lib/m4LiveAdapter';
const out=process.argv[2];assert(out&&!fs.existsSync(out));
const config=read('config/contractgen-stage8-pilot-v1.json'),original=fs.readFileSync;
const reads=new Set<string>();
(fs as any).readFileSync=(file:any,...args:any[])=>{
 const p=String(file).replaceAll('\\','/');reads.add(p);
 if(/evaluation-only|\/oracles\/|(?:^|\/)test\//.test(p)||(/(?:^|\/)results\//.test(p)&&!p.endsWith('results/contractgen-stage5-preflight-v1/pilot-plan.json')))throw Error(`Forbidden generation read: ${p}`);
 return (original as any)(file,...args);
};
try{for(const id of config.pilot)for(const arm of arms8){const r=request8(id,arm);
 assert(!r.messages.some(m=>m.content.includes('103/114')));assert(!('OwnModelDecomposition'in r.body));}}
finally{fs.readFileSync=original;}
save(`${out}/summary.json`,{requests:15,reads:[...reads],passed:true,realModelCalls:0,paidCalls:0});
console.log('PASS: 15 request builders forbid Oracle/history/other-arm reads');
