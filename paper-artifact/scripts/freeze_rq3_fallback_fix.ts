import fs from 'node:fs';
import assert from 'node:assert/strict';
import {digestFile} from './lib/rq1Batch114';
const root='results/rq3-fallback-fix-v1';
const before=JSON.parse(fs.readFileSync(`${root}/before.json`,'utf8'));
const changes:Record<string,{before:string;after:string}>={};
for(const [file,hash] of Object.entries(before.changedSourceCandidates)){
 assert.equal(digestFile(`${root}/before/${file}`),hash);
 changes[file]={before:hash as string,after:digestFile(file)};
}
for(const [file,hash] of Object.entries(before.protectedFiles)){
 if(!changes[file.replaceAll('\\','/')])assert.equal(digestFile(file),hash,`Protected file changed: ${file}`);
}
const currentFiles:Record<string,string>={};
for(const file of [...Object.keys(changes),'src/app/service/oclTokenIdentity.ts','src/app/service/repairPermissionInstruction.ts','scripts/rq3SourceRevision.ts','scripts/freeze_rq3_fallback_fix.ts'])currentFiles[file]=digestFile(file);
assert.equal(JSON.parse(fs.readFileSync(`${root}/tests-v4/summary.json`,'utf8')).checks,50);
const target=`${root}/revision.json`;
assert(!fs.existsSync(target),'Revision already frozen');
fs.writeFileSync(target,JSON.stringify({version:'rq3-fallback-fix-v6',beforeManifestHash:digestFile(`${root}/before.json`),changes,currentFiles,evidence:{tests:digestFile(`${root}/tests-v4/summary.json`),samplePool:digestFile('results/rq3-failure-pool-audit-v1/summary.json')},realModelCalls:0,paidCalls:0},null,2));
console.log({revision:target,protectedFilesVerified:Object.keys(before.protectedFiles).length});
