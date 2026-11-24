import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ccHash} from './crossClauseGraph';
import {createOperationModelGrounding} from './operationModelGrounding';
import type {ProjectParam} from '../type';
import type {OperationModelGrounding} from './operationModelGrounding';

const ROOT = 'data/narrative_v3_114/generation';
export function loadNarrativeOperation(param: ProjectParam & {operation: string; narrativeRequirement?: string;
  signature?: unknown; typedModel?: OperationModelGrounding; operationId?: string; datasetVersion?: string; snapshotRoot?:string}) {
  const id = `${param.project}_${param.useCase}_${param.operation}`;
  if (param.operationId && param.operationId !== id) throw new Error('Narrative operation identity mismatch');
  if (param.datasetVersion && param.datasetVersion !== 'Narrative-V3') throw new Error('Unsupported Narrative dataset');
  const root=param.snapshotRoot?`${param.snapshotRoot}/generation`:ROOT;
  const bytes = fs.readFileSync(`${root}/requirements.jsonl`);
  if(param.snapshotRoot){
    const manifest=JSON.parse(fs.readFileSync(`${param.snapshotRoot}/manifest.json`,'utf8'));
    for(const file of ['generation/requirements.jsonl',`generation/models/${id}/typed-model.json`,`generation/models/${id}/signature.json`,'clarifications.json','public-profiles.json']){
      const actual=createHash('sha256').update(fs.readFileSync(`${param.snapshotRoot}/${file}`)).digest('hex');
      if(actual!==manifest.files[file])throw Error(`Frozen Narrative snapshot integrity failure: ${file}`);
    }
  }
  const rows = bytes.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map(row => row.operationId)).size !== 114) throw new Error('Narrative dataset identity invalid');
  const row = rows.find(row => row.operationId === id);
  if (!row) throw new Error(`No frozen Narrative requirement for ${id}; select Legacy explicitly`);
  const context: OperationModelGrounding = JSON.parse(fs.readFileSync(`${root}/models/${id}/typed-model.json`, 'utf8'));
  const signature = JSON.parse(fs.readFileSync(`${root}/models/${id}/signature.json`, 'utf8'));
  if (param.narrativeRequirement !== undefined && param.narrativeRequirement !== row.description) throw new Error('Frozen Narrative text mismatch');
  if (param.signature !== undefined && ccHash(param.signature) !== ccHash(signature)) throw new Error('Operation signature mismatch');
  if (param.typedModel !== undefined && ccHash(param.typedModel) !== ccHash(context)) throw new Error('Authoritative UML mismatch');
  const current = createOperationModelGrounding(param);
  if (ccHash(current.index) !== ccHash(context.index) || ccHash(current.rules) !== ccHash(context.rules)) throw new Error('Runtime UML differs from frozen model');
  return {row, context, signature, datasetSha256: createHash('sha256').update(bytes).digest('hex'),
    input: {operationId: id, narrativeRequirement: row.description, sourceHash: ccHash(row.description),
      parameters: context.index.operation.parameters.map(p => p.name), modelTypes: context.index.entities.map(e => e.name)}};
}
