import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const NARRATIVE_BASELINE_PATH = 'results/narrative-stage7-v1/release-baseline/manifest.json';
export function verifyNarrativeBaseline() {
  if (!fs.existsSync(NARRATIVE_BASELINE_PATH)) throw new Error('Stage 7 Narrative baseline not frozen');
  const baseline = JSON.parse(fs.readFileSync(NARRATIVE_BASELINE_PATH, 'utf8'));
  if (baseline.version !== 'narrative-unified-baseline-v1') throw new Error('Unknown Narrative baseline');
  for (const [file, digest] of Object.entries(baseline.files)) {
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== digest) throw new Error(`Narrative frozen file changed: ${file}`);
  }
  return baseline;
}
