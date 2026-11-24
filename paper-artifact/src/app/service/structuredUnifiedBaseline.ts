import fs from 'node:fs';
import {createHash} from 'node:crypto';

export const STRUCTURED_UNIFIED_BASELINE_PATH='results/structured-unified-stage71-v1/release-baseline/manifest.json';
const digest=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
/** Explicit study baseline only: never replaces Stage7 production authorization. */
export function verifyStructuredUnifiedBaseline(file=STRUCTURED_UNIFIED_BASELINE_PATH){
  const baseline=JSON.parse(fs.readFileSync(file,'utf8'));
  if(baseline.version!=='structured-narrative-unified-baseline-v1'||baseline.paidAuthorized!==false)
    throw Error('Unknown or unauthorized input study baseline');
  if(digest(baseline.parentManifest)!==baseline.parentManifestSha256)throw Error('Historical Stage7 manifest changed');
  for(const [source,hash]of Object.entries(baseline.files))if(digest(source)!==hash)throw Error(`Input study frozen file changed: ${source}`);
  return baseline;
}
