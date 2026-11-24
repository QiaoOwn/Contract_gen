import fs from 'node:fs';
import assert from 'node:assert/strict';
import {digestFile} from './lib/rq1Batch114';

export function rq3CurrentSourceFiles(){
 const old=JSON.parse(fs.readFileSync('results/rq2-validation-narrative-v1/manifest.json','utf8')).files;
 const file='results/rq3-fallback-fix-v1/revision.json';
 assert(fs.existsSync(file),'New backend revision is not frozen yet; do not reuse earlier experiment previews');
 const revision=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(revision.version,'rq3-fallback-fix-v6');
 assert.equal(digestFile('results/rq3-fallback-fix-v1/before.json'),revision.beforeManifestHash);
 const files:Record<string,string>={};
 for(const [p,h]of Object.entries(old)){
  const changed=revision.changes[p.replaceAll('\\','/')];
  if(changed)assert.equal(changed.before,h,'Revision does not match historical source');
  files[p]=changed?.after??h as string;
 }
 Object.assign(files,revision.currentFiles);files[file]=digestFile(file);
 for(const [p,h]of Object.entries(files))assert.equal(digestFile(p),h,`Current revision drift: ${p}`);
 return files;
}
