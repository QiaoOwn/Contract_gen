import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {OperationInputMetadata} from './createOperationInput';
import type {DevelopmentSource} from './developmentBehavior/types';
import {RepairGuardError} from './repairGuards';
import type {GenerationTaskPlan} from './generationTaskPlan';
import type {SemanticContractPlan} from './semanticContractPlan';
import type {ConstraintTaskPlan} from './constraintTaskPlan';
import type {ConstraintControlRecord} from './constraintRepairControl';

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export type ReadOnlyRepairInput = {
  modelGroundingContext: OperationModelGrounding;
  inputMetadata: OperationInputMetadata;
  developmentRequirement: string;
  messages: {content: unknown}[];
  generationTaskPlan?: GenerationTaskPlan | null;
  semanticContractPlan?: SemanticContractPlan | null;
  constraintTaskPlan?: ConstraintTaskPlan | null;
  constraintRepairControl?: ConstraintControlRecord | null;
};
export type ReadOnlyRepairEvidence = {
  version: 'readonly-repair-evidence-v1';
  inputHash: string;
  files: {path: string; sha256: string}[];
};
const payloadHash = (input: ReadOnlyRepairInput) =>
  hash(
    JSON.stringify({
      context: input.modelGroundingContext,
      metadata: input.inputMetadata,
      requirement: input.developmentRequirement,
      generationTaskPlan: input.generationTaskPlan,
      semanticContractPlan: input.semanticContractPlan,
      constraintTaskPlan: input.constraintTaskPlan,
      constraintRepairControl: input.constraintRepairControl,
      messages: input.messages.map((message) => message.content),
    })
  );

export function captureReadOnlyRepairEvidence(
  input: ReadOnlyRepairInput,
  sources: readonly DevelopmentSource[]
): ReadOnlyRepairEvidence {
  const {index} = input.modelGroundingContext;
  const declarations = [
    index.operation,
    ...index.operation.parameters,
    ...index.operation.serviceState,
    ...(index.operation.returnType ? [index.operation.returnType] : []),
    ...index.entities.flatMap((entity) => [entity, ...entity.features]),
  ];
  const files = new Map<string, string>();
  for (const source of [
    ...sources.map((item) => ({file: item.path, sha256: item.sha256})),
    ...declarations.flatMap((item) => (item.source ? [item.source] : [])),
  ]) {
    const resolved = path.resolve(source.file);
    if (files.has(resolved) && files.get(resolved) !== source.sha256)
      throw new RepairGuardError(
        'READ_ONLY_EVIDENCE_CHANGED',
        `conflicting source fingerprints: ${source.file}`
      );
    files.set(resolved, source.sha256);
  }
  // Include all project declaration files: the prompt can contain more than the current signature.
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.ts') && !files.has(file))
        files.set(file, hash(fs.readFileSync(file)));
    }
  };
  visit(path.resolve('src/rm2pt/project', index.project));
  if (input.generationTaskPlan) {
    const file = path.resolve('config/generation-task-bindings.json');
    files.set(file, hash(fs.readFileSync(file)));
  }
  if (input.semanticContractPlan) {
    const file = path.resolve('config/semantic-planning-policy.json');
    files.set(file, hash(fs.readFileSync(file)));
  }
  if (input.constraintTaskPlan) {
    const file = path.resolve('config/constraint-solving-policy.json');
    files.set(file, hash(fs.readFileSync(file)));
  }
  const snapshot: ReadOnlyRepairEvidence = {
    version: 'readonly-repair-evidence-v1',
    inputHash: payloadHash(input),
    files: [...files]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([file, sha256]) => ({path: file, sha256})),
  };
  assertReadOnlyRepairEvidence(snapshot, input);
  return snapshot;
}

export function assertReadOnlyRepairEvidence(
  snapshot: ReadOnlyRepairEvidence,
  input: ReadOnlyRepairInput
) {
  if (snapshot.inputHash !== payloadHash(input))
    throw new RepairGuardError(
      'READ_ONLY_EVIDENCE_CHANGED',
      'requirement, prompt input, model context or rules changed; stop repair without changing the candidate to hide it.'
    );
  for (const file of snapshot.files) {
    if (!fs.existsSync(file.path) || hash(fs.readFileSync(file.path)) !== file.sha256)
      throw new RepairGuardError(
        'READ_ONLY_EVIDENCE_CHANGED',
        `${file.path}; restore or explicitly review the source outside this repair run.`
      );
  }
}
