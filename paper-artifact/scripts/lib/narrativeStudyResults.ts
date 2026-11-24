import fs from 'node:fs';
import path from 'node:path';
import {hash, read} from './m4LiveAdapter';

export function studyResultUnits(directory: string, pilot: string[]) {
  const outcomes = (slot: string) => {
    const base = path.join(directory, slot);
    return {slot, reservation: fs.existsSync(`${base}/reservation.json`) ? read(`${base}/reservation.json`) : null,
      outcome: fs.existsSync(`${base}/outcome.json`) ? read(`${base}/outcome.json`) : null,
      skipped: fs.existsSync(`${base}/skipped.json`) ? read(`${base}/skipped.json`) : null,
      raw: fs.existsSync(`${base}/raw-response.json`) ? read(`${base}/raw-response.json`) : null};
  };
  return pilot.flatMap(operationId => ['A','B','C','D','E'].map(arm => {
    const slots = (arm === 'B' ? ['B-extract','B-generate'] : [arm]).map(step => outcomes(`${operationId}__${step}`));
    const candidateFile = path.join(directory,`${operationId}__${arm}.candidate.json`);
    const record = fs.existsSync(candidateFile) ? read(candidateFile) : null;
    if (record && (record.id !== operationId || record.arm !== arm)) throw new Error('Study candidate unit identity mismatch');
    const sum = (field: 'inputTokens' | 'outputTokens' | 'latencyMs') => {
      const reserved = slots.filter(slot => slot.reservation);
      return reserved.length && reserved.every(slot => typeof (slot.outcome?.[field] ?? slot.raw?.[field]) === 'number') ?
        reserved.reduce((total, slot) => total + (slot.outcome?.[field] ?? slot.raw?.[field]), 0) : null;
    };
    const state = slots.some(slot => slot.outcome?.status === 'unknown' || slot.reservation && !slot.outcome) ? 'unknown' :
      slots.some(slot => slot.skipped) ? 'cancelled' : slots.some(slot => slot.outcome?.status === 'protocol-invalid') ? 'protocol-invalid' :
        record ? 'candidate-received' : 'not-evaluated';
    return {operationId, arm, generationStatus: state, slots, candidate: record?.value ?? null,
      cost: {logicalCalls: slots.filter(slot=>slot.reservation).length, inputTokens:sum('inputTokens'),outputTokens:sum('outputTokens'),latencyMs:sum('latencyMs')},
      evaluation: null as unknown, behavioralAssessment:'not-evaluated', unresolvedCountsAsPassOrFail:false};
  }));
}
export function boundStudyCoverage(identity: {coveragePath: string; files: Record<string,string>}, requestedPath?: string) {
  if (requestedPath && path.resolve(requestedPath) !== path.resolve(identity.coveragePath)) throw new Error('Coverage mapping is bound to run identity');
  const file = identity.coveragePath;
  if (!identity.files[file] || hash(fs.readFileSync(file)) !== identity.files[file]) throw new Error('Coverage hash not in frozen study identity');
  return read(file);
}
