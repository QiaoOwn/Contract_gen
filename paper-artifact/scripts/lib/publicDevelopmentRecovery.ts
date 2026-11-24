import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

const read=(file:string)=>JSON.parse(fs.readFileSync(file,'utf8'));
export function publicRunLocation(root:string,sampleId:string){
 assert(/^repair-[a-f0-9]+$/.test(sampleId),'Invalid sample ID');
 const base=path.resolve(root,'runs',sampleId),journal=path.join(base,'network-recovery.json');
 const entries: {directory:string;consumedCalls:number;replaySource?:string;replayCount?:number}[]=fs.existsSync(journal)?read(journal).entries:[];
 for(const entry of entries){
  assert(Number.isInteger(entry.consumedCalls)&&entry.consumedCalls>=0);
  assert(path.resolve(entry.directory).startsWith(base+path.sep),'Recovery directory escaped sample');
 }
 return {base,journal,entries,directory:entries.at(-1)?.directory??base,
  consumedCalls:entries.reduce((sum,e)=>sum+e.consumedCalls,0)};
}

export function recoverPublicBudgetRun(root:string,sampleId:string){
 const location=publicRunLocation(root,sampleId),summary=read(path.join(location.directory,'summary.json'));
 assert.equal(summary.stop,'input-budget-blocked');
 const result=read(path.join(location.directory,'result.json')),round=result.events.length;
 assert(round>=1&&round<=4);
 assert.equal(result.events.at(-1).status,'input-budget-blocked');
 assert(!fs.existsSync(path.join(location.directory,`repair__${round}`,'reservation.json')),'Blocked call was already reserved');
 for(let n=1;n<round;n++){
  assert.equal(read(path.join(location.directory,`repair__${n}`,'outcome.json')).status,'received');
  assert(fs.existsSync(path.join(location.directory,`repair__${n}`,'raw-response.json')));
 }
 assert.equal(summary.realModelCalls,round-1-(summary.replayedHistoricalCalls??0),'Calls must match received responses');
 assert(location.consumedCalls+summary.realModelCalls<4,'Repair budget exhausted');
 const directory=path.join(location.base,'recoveries',randomUUID());
 const entries=[...location.entries,{directory,consumedCalls:summary.realModelCalls,replaySource:location.directory,replayCount:round-1}];
 const temporary=location.journal+'.tmp-'+randomUUID();
 fs.writeFileSync(temporary,JSON.stringify({version:1,reason:'pre-call-input-budget-fix',entries},null,2),{flag:'wx'});
 fs.renameSync(temporary,location.journal);
 return publicRunLocation(root,sampleId);
}

// Replay received responses locally to reconstruct controller state; never refund unknown calls.
export function recoverPublicNetworkRun(root:string,sampleId:string){
 const location=publicRunLocation(root,sampleId),summary=read(path.join(location.directory,'summary.json'));
 assert.equal(summary.stop,'transport-or-response-stop','Only transport stops can resume here');
 const result=read(path.join(location.directory,'result.json'));
 const round=result.events.length;
 assert(round>=1&&round<=4,'Invalid round count');
 assert(!result.events.at(-1).candidate,'A received candidate must not be discarded');
 for(let n=1;n<round;n++){
  assert.equal(read(path.join(location.directory,`repair__${n}`,'outcome.json')).status,'received','Prior response missing');
  assert(fs.existsSync(path.join(location.directory,`repair__${n}`,'raw-response.json')),'Raw response missing');
 }
 assert(!fs.existsSync(path.join(location.directory,`repair__${round}`,'raw-response.json')),'Received response requires separate inspection');
 const error=read(path.join(location.directory,'network-errors',`${round}.json`));
 assert(error.causes?.some((c:any)=>/network error|timeout|fetch failed|terminated/i.test(c.message)),
  'Not a verified transport failure; inspect response/protocol evidence');
 const calls=summary.realModelCalls;
 assert(Number.isInteger(calls)&&calls>=1&&calls<=round,'Unknown reservation count');
 const consumedCalls=location.consumedCalls+calls;
 assert(consumedCalls<4,'Total four-call repair budget exhausted');
 const directory=path.join(location.base,'recoveries',randomUUID());
 const entries=[...location.entries,{directory,consumedCalls:calls,replaySource:location.directory,replayCount:round-1}];
 const temporary=location.journal+'.tmp-'+randomUUID();
 fs.writeFileSync(temporary,JSON.stringify({version:1,mayHaveConsumedFees:true,entries},null,2),{flag:'wx'});
 fs.renameSync(temporary,location.journal);
 return publicRunLocation(root,sampleId);
}
