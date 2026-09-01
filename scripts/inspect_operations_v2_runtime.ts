/** Read-only comparison with the real input builder. No model/API calls. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildOperationInput} from '../src/app/service/createOperationInput';
import type {ProjectParam} from '../src/app/type';

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const rows = fs
  .readFileSync(process.argv[2], 'utf8')
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
const checks = rows.map((row) => {
  const input = buildOperationInput({
    project: row.project as ProjectParam['project'],
    useCase: row.useCase as ProjectParam['useCase'],
    operation: row.operation,
  });
  return {
    id: row.id,
    context_matches_current_service: row.model_context === input.modelContext,
    signature_matches_current_service:
      row.operation_signature === input.metadata.operationSignature,
    preserved_context_sha256: digest(row.model_context),
    current_service_context_sha256: input.metadata.contextHash,
    preserved_context_declares_today: row.model_context.includes('Today: Date'),
    preserved_context_declares_now: row.model_context.includes('Now: Date'),
    current_schema_version: input.metadata.schemaVersion,
  };
});
process.stdout.write(JSON.stringify(checks));
