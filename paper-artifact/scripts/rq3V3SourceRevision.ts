import fs from 'node:fs';
import assert from 'node:assert/strict';
import {digestFile} from './lib/rq1Batch114';

/** Record current sources without requiring historical version/hash matches. */
export function rq3V3SourceFiles(){
 const parentFile='results/rq3-fallback-fix-v1/revision.json';
 const parent=JSON.parse(fs.readFileSync(parentFile,'utf8'));
 const old=JSON.parse(fs.readFileSync('results/rq2-validation-narrative-v1/manifest.json','utf8')).files;
 const files:Record<string,string>={};
 for(const [p,h]of Object.entries(old)){
  const change=parent.changes[p.replaceAll('\\','/')];
  files[p]=change?.after??h as string;
 }
 Object.assign(files,parent.currentFiles);files[parentFile]=digestFile(parentFile);
 const manifest='config/rq3-v3-backend-revision-v1.json';
 const overlay=JSON.parse(fs.readFileSync(manifest,'utf8'));
 const allowed=['public/LogicFormulaBuilder.ts','public/OCLStateSnapshot.ts','src/app/service/generateTypescriptCode.ts'];
 for(const p of allowed){
  const keys=Object.keys(files).filter(k=>k.replaceAll('\\','/')===p);
  assert(keys.length,`Missing parent backend source: ${p}`);
  for(const k of keys)files[k]=digestFile(k);
 }
 files[manifest]=digestFile(manifest);
 files['scripts/rq3V3SourceRevision.ts']=digestFile('scripts/rq3V3SourceRevision.ts');
 for(const p of Object.keys(files))files[p]=digestFile(p);
 return files;
}
