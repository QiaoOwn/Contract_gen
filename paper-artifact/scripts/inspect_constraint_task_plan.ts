import fs from 'node:fs';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {buildOperationInput} from '../src/app/service/createOperationInput';
import {historicalOraclePath, boundaryOraclePath, type OracleProfile} from '../src/app/service/labAdjudicatedOracle';
import {prepareConstraintGeneration} from '../src/app/service/constraintTaskPlan';
import {
  createConstraintSolvingSystemPrompt,
  CONSTRAINT_SOLVER_PROMPT_VERSION,
} from '../src/app/service/constraintSolving';

const {values} = parseArgs({
  options: {
    'operation-id': {type: 'string'},
    'oracle-profile': {type: 'string'},
    input: {
      type: 'string',
      default: 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl',
    },
  },
});
const bytes = fs.readFileSync(values.input!);
const rows = bytes
  .toString('utf8')
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
const matching = rows.filter((row) => row.id === values['operation-id']);
if (matching.length !== 1) throw new Error('Specify exactly one existing --operation-id');
const row = matching[0];
const input = buildOperationInput({
  project: row.project,
  useCase: row.useCase,
  operation: row.operation_name,
  userInput: row.description,
  constraintSolving: true,
});
const profile = values['oracle-profile'];
if (profile && !['lab-adjudicated-114-v1', 'rm2pt-authoritative-preparation',
  'rm2pt-authoritative-preparation-v2', 'rm2pt-authoritative-preparation-v3', 'rm2pt-authoritative-preparation-v4'].includes(profile))
  throw new Error('Unsupported constraint-solving Oracle profile');
let evaluation: {profile: string; ready: boolean; status: string; files: {path: string; sha256: string}[]} | undefined;
if (profile) {
  const current = profile === 'rm2pt-authoritative-preparation' ||
    profile === 'rm2pt-authoritative-preparation-v2' || profile === 'rm2pt-authoritative-preparation-v3' || profile === 'rm2pt-authoritative-preparation-v4';
  const expected = profile === 'rm2pt-authoritative-preparation-v4'
    ? 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl'
    : profile === 'rm2pt-authoritative-preparation-v3'
    ? 'data/benchmark/rm2pt_authoritative_114_v3/operations.jsonl'
    : profile === 'rm2pt-authoritative-preparation-v2'
    ? 'data/benchmark/rm2pt_authoritative_114_v2/operations.jsonl'
    : current ? 'data/benchmark/rm2pt_authoritative_114/operations.jsonl'
      : 'data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl';
  if (path.resolve(values.input!) !== path.resolve(expected)) throw new Error('Input and Oracle profile mismatch');
  if (current && (input.metadata.inputHash !== row.input_hash || input.metadata.contextHash !== row.context_hash ||
      input.constraintTaskPlan!.hash !== row.constraint_task_plan_hash || input.content !== row.canonical_user_message))
    throw new Error('Runtime input differs from the source-aligned prepared operation');
  const oracleDirectory = profile === 'rm2pt-authoritative-preparation-v4'
    ? 'data/benchmark/rm2pt_authoritative_114_v4/oracles'
    : profile === 'rm2pt-authoritative-preparation-v3'
    ? 'data/benchmark/rm2pt_authoritative_114_v3/oracles'
    : profile === 'rm2pt-authoritative-preparation-v2'
    ? 'data/benchmark/rm2pt_authoritative_114_v2/oracles'
    : 'data/benchmark/rm2pt_authoritative_114/oracles';
  const registered = !current || JSON.parse(fs.readFileSync(`${oracleDirectory}/manifest.json`, 'utf8'))
    .records.some((item: {id: string}) => item.id === row.id);
  const files = registered ? [
    historicalOraclePath(profile as OracleProfile, row.project, row.useCase, row.operation_name, 'forbidden'),
    boundaryOraclePath(profile as OracleProfile, row.project, row.useCase, row.operation_name),
  ].filter((file): file is string => Boolean(file)).map(file => ({
    path: path.relative(process.cwd(), file).replaceAll('\\', '/'),
    sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  })) : [];
  evaluation = {profile, ready: registered, status: registered ? 'selected-files-verified-not-fidelity-certification' : 'not-prepared-no-fallback', files};
}
process.stdout.write(
  JSON.stringify({
    operationId: row.id,
    inputSha256: createHash('sha256').update(bytes).digest('hex'),
    plan: input.constraintTaskPlan,
    preparation: prepareConstraintGeneration({plan: input.constraintTaskPlan!, context: input.modelGroundingContext,
      requirement: input.requirement, input: input.content, inputHash: input.metadata.inputHash}),
    inputMetadata: input.metadata,
    ...(evaluation ? {evaluation} : {}),
    solverPromptVersion: CONSTRAINT_SOLVER_PROMPT_VERSION,
    solverPromptHash: createHash('sha256')
      .update(createConstraintSolvingSystemPrompt())
      .digest('hex'),
    containsPrecomputedAnswer: false,
  }) + '\n'
);
