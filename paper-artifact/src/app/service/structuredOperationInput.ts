import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createOperationModelGrounding} from './operationModelGrounding';
import {ccHash} from './crossClauseGraph';
import type {ProjectParam} from '../type';
import type {OperationModelGrounding} from './operationModelGrounding';

export const STRUCTURED_UNIFIED_INPUT = 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl';
export function loadStructuredUnifiedOperation(param: ProjectParam & {operation: string; requirement?: string; operationId?: string;
  signature?: unknown; typedModel?: OperationModelGrounding; datasetVersion?: string}) {
  const id = `${param.project}_${param.useCase}_${param.operation}`;
  if (param.operationId && param.operationId !== id || param.datasetVersion && param.datasetVersion !== 'Structured-v4') throw new Error('Structured dataset/operation identity mismatch');
  const bytes = fs.readFileSync(STRUCTURED_UNIFIED_INPUT);
  const rows = bytes.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map(row => row.id)).size !== 114) throw new Error('Frozen Structured registry invalid');
  const original = rows.find(row => row.id === id);
  if (!original) throw new Error('Missing Structured operation');
  const context: OperationModelGrounding = JSON.parse(fs.readFileSync(`data/narrative_v3_114/generation/models/${id}/typed-model.json`, 'utf8'));
  const signature = JSON.parse(fs.readFileSync(`data/narrative_v3_114/generation/models/${id}/signature.json`, 'utf8'));
  const current = createOperationModelGrounding(param);
  if (original.operation_signature !== signature.signature || ccHash(current) !== ccHash(context) ||
      param.requirement !== undefined && param.requirement !== original.description ||
      param.signature !== undefined && ccHash(param.signature) !== ccHash(signature) ||
      param.typedModel !== undefined && ccHash(param.typedModel) !== ccHash(context)) throw new Error('Frozen Structured requirement/model/signature mismatch');
  // Only public source fields are returned; old solver prompts, results and Oracle metadata never enter this view.
  return {row: {operationId: id, project: original.project, useCase: original.useCase, description: original.description}, context, signature,
    datasetSha256: createHash('sha256').update(bytes).digest('hex'), input: {operationId: id, narrativeRequirement: original.description,
      sourceHash: ccHash(original.description), parameters: context.index.operation.parameters.map(p => p.name), modelTypes: context.index.entities.map(e => e.name)}};
}
