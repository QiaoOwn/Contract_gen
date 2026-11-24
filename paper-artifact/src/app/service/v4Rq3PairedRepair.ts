import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import type {OpenAIChatModelId} from '@langchain/openai';
import type {ProjectParam} from '../type';
import {buildOperationInput} from './createOperationInput';
import {auditTaskEvidence, type TaskSolutionIssue} from './constraintTaskPlan';
import {
  createConstraintSolvingSystemPrompt,
  executeConstraintSolving,
  taskSolutionSchema,
} from './constraintSolving';
import {generateStructuredJsonDetailed, StructuredJsonOutputError, type OclGenerationUsage} from './generateOclWithJsonMode';
import {generationMessageTrace} from './generationMessageTrace';
import {auditDirectedRepair} from './directedRepair';
import {createRepairProtocol} from './developmentBehavior/developmentRepair';
import {captureReadOnlyRepairEvidence} from './repairIntegrity';
import {graph} from './graph';
import type {RepairDiagnostic} from './repairDiagnostics';

const ROOT = process.cwd();
const INPUT = 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl';
const POOL = 'results/contractgen-rm2pt-v4/rq3/initial-failure-pool-v1';
const MODEL = 'gpt-5.5' as OpenAIChatModelId;
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.apiyi.com/v1';
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const read = (name: string) => fs.readFileSync(path.resolve(ROOT, name), 'utf8');

export const v4Rq3RequestSchema = z.object({
  operationId: z.string().min(1),
  arm: z.enum(['raw-diagnostic', 'model-grounded-bounded']),
  apiKey: z.string().min(1),
  expectedPoolHash: z.string().regex(/^[a-f0-9]{64}$/),
  prepareOnly: z.boolean().optional(),
}).strict();
export type V4Rq3Request = z.infer<typeof v4Rq3RequestSchema>;

type Contract = {definition: string; precondition: string; postcondition: string};
type PoolRecord = {
  operation_id: string;
  model: string;
  input_sha256: string;
  source_dir: string;
  source_files_sha256: Record<string, string>;
  plan_hash: string;
  solver_prompt_hash: string;
  initial_contract: Contract;
  initial_proposal: unknown;
  initial_diagnostics: RepairDiagnostic[];
};
type InputRow = {id: string; project: string; useCase: string; operation_name: string; description: string};

function frozenRecord(request: V4Rq3Request) {
  const summary = JSON.parse(read(`${POOL}/summary.json`));
  const poolText = read(`${POOL}/eligible_failures.jsonl`);
  if (hash(poolText) !== request.expectedPoolHash ||
      hash(poolText) !== summary.frozen_files?.['eligible_failures.jsonl'] ||
      hash(read(INPUT)) !== summary.input_sha256 ||
      summary.hidden_jest_used_for_selection !== false)
    throw new Error('RQ3 pool or v4 input differs from the frozen preflight');
  const records = poolText.split('\n').filter(Boolean).map(line => JSON.parse(line) as PoolRecord);
  const record = records.find(item => item.operation_id === request.operationId);
  if (!record || record.model !== MODEL || record.input_sha256 !== summary.input_sha256 ||
      !record.initial_diagnostics.length || record.initial_diagnostics.some(item => !item.repairEligible))
    throw new Error('Operation is not a frozen repair-eligible GPT-5.5 initial failure');
  const source = path.resolve(ROOT, record.source_dir);
  if (!source.startsWith(path.resolve(ROOT, 'results') + path.sep))
    throw new Error('RQ3 source must stay under project results');
  for (const [name, digest] of Object.entries(record.source_files_sha256)) {
    if (!/^[a-z_]+\.(json|jsonl|ndjson)$/.test(name) || hash(fs.readFileSync(path.join(source, name))) !== digest)
      throw new Error(`Frozen source evidence changed: ${name}`);
  }
  const sourceSummary = JSON.parse(fs.readFileSync(path.join(source, 'summary.json'), 'utf8'));
  if (sourceSummary.operation_id !== record.operation_id || sourceSummary.plan_hash !== record.plan_hash ||
      sourceSummary.solver_prompt_hash !== record.solver_prompt_hash)
    throw new Error('Source run and failure pool disagree');
  const oracleManifest = 'data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json';
  if (hash(fs.readFileSync(path.resolve(ROOT, oracleManifest))) !== sourceSummary.oracle_lock_hash ||
      sourceSummary.oracle_binding?.profile !== 'rm2pt-authoritative-preparation-v4' ||
      sourceSummary.oracle_binding?.ready !== true ||
      !Array.isArray(sourceSummary.oracle_binding.files) ||
      sourceSummary.oracle_binding.files.length === 0)
    throw new Error('Frozen v4 Oracle profile or manifest changed');
  for (const file of sourceSummary.oracle_binding.files as {path: string; sha256: string}[]) {
    const resolved = path.resolve(ROOT, file.path);
    if (!resolved.startsWith(path.resolve(ROOT, 'data/benchmark') + path.sep) ||
        hash(fs.readFileSync(resolved)) !== file.sha256)
      throw new Error(`Frozen operation Oracle changed: ${file.path}`);
  }
  const rows = read(INPUT).split('\n').filter(Boolean).map(line => JSON.parse(line) as InputRow);
  if (rows.length !== 114 || new Set(rows.map(row => row.id)).size !== 114)
    throw new Error('The v4 input no longer has 114 distinct operations');
  const row = rows.find(item => item.id === request.operationId);
  if (!row) throw new Error('Operation missing from the frozen v4 input');
  return {record, row};
}

async function validateCandidate(
  row: InputRow,
  input: ReturnType<typeof buildOperationInput>,
  candidate: Contract,
  issues: TaskSolutionIssue[],
  apiKey: string
) {
  const settings = {
    project: row.project,
    useCase: row.useCase,
    operation: row.operation_name,
  } as ProjectParam & {operation: string};
  const state = {
    ...settings,
    model: MODEL,
    apiKey,
    oracleProfile: 'rm2pt-authoritative-preparation-v4' as const,
    developmentBehavior: false,
    developmentRequirement: input.requirement,
    feedbackMode: 'full' as const,
    maxGenerationAttempts: 1,
    generationCount: 1,
    ocl: candidate,
    constraintTaskPlan: input.constraintTaskPlan!,
    taskSolutionIssues: issues,
    taskSolutionAudit: null,
    generationTaskPlan: null,
    semanticContractPlan: null,
    repairProtocol: createRepairProtocol(false),
    inputMetadata: input.metadata,
    modelGroundingContext: input.modelGroundingContext,
    messages: [{role: 'user', content: input.content}],
  };
  const snapshot = captureReadOnlyRepairEvidence(state, []);
  const stream = await graph.stream({...state, readOnlyRepairEvidence: snapshot}, {recursionLimit: 12});
  const diagnostics: RepairDiagnostic[] = [];
  let terminal: Record<string, unknown> | null = null;
  for await (const event of stream) {
    if ('OCL Generator' in event) throw new Error('Seeded validation unexpectedly called the model');
    for (const name of ['Contract Generator', 'TypeScript Generator', 'TypeScript Parser'] as const) {
      const node = event[name] as {repairDiagnostics?: RepairDiagnostic[]} | undefined;
      if (node?.repairDiagnostics?.length) diagnostics.push(...node.repairDiagnostics);
    }
    if ('Test Result' in event) terminal = event['Test Result'] as Record<string, unknown>;
  }
  if (Boolean(terminal) === Boolean(diagnostics.length))
    throw new Error('Seeded validation must end with either PreExec diagnostics or one terminal evaluation');
  return {
    preexecValid: Boolean(terminal),
    diagnostics,
    hiddenEvaluated: Boolean(terminal),
    hiddenPassed: terminal ? Boolean((terminal.result as {success?: boolean} | undefined)?.success) : null,
    methodAccepted: terminal ? terminal.methodAccepted === true : null,
  };
}

export async function* runV4Rq3PairedRepair(requestValue: unknown) {
  const request = v4Rq3RequestSchema.parse(requestValue);
  const {record, row} = frozenRecord(request);
  const input = buildOperationInput({
    project: row.project, useCase: row.useCase, operation: row.operation_name,
    userInput: row.description, constraintSolving: true, modelGrounding: true,
  } as ProjectParam & {operation: string; userInput: string; constraintSolving: true; modelGrounding: true});
  if (input.constraintTaskPlan?.hash !== record.plan_hash ||
      hash(createConstraintSolvingSystemPrompt()) !== record.solver_prompt_hash)
    throw new Error('Current task plan or solver prompt differs from the frozen source');
  const sourceProposal = taskSolutionSchema.parse(record.initial_proposal);
  const initialIssues = auditTaskEvidence(
    input.constraintTaskPlan, record.initial_contract, sourceProposal.taskEvidence, input.modelGroundingContext
  ).issues;
  const initial = await validateCandidate(row, input, record.initial_contract, initialIssues, request.apiKey);
  const signature = (items: RepairDiagnostic[]) => items.map(item => `${item.stage}:${item.code}`).sort();
  if (initial.preexecValid || JSON.stringify(signature(initial.diagnostics)) !==
      JSON.stringify(signature(record.initial_diagnostics)))
    throw new Error('Initial candidate no longer reproduces its frozen PreExec failure');
  yield {
    phase: 'seed-validated', operationId: row.id, arm: request.arm,
    planHash: input.constraintTaskPlan.hash, initialContractHash: hash(JSON.stringify(record.initial_contract)),
    initialDiagnosticCodes: signature(initial.diagnostics), poolHash: request.expectedPoolHash,
    realModelCalls: 0, hiddenEvaluations: 0,
  };
  if (request.prepareOnly) return;

  let previous = record.initial_contract;
  let previousProposal: unknown = record.initial_proposal;
  let diagnostics = initial.diagnostics;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const system = createConstraintSolvingSystemPrompt();
    let candidate: Contract = previous;
    let proposal: unknown;
    let issues: TaskSolutionIssue[] = [];
    let trace: ReturnType<typeof generationMessageTrace>;
    let guidedAudit: Awaited<ReturnType<typeof executeConstraintSolving>>['audit'] | null = null;
    let usage: OclGenerationUsage | null = null;
    yield {phase: 'model-call-started', operationId: row.id, arm: request.arm, attempt};
    if (request.arm === 'model-grounded-bounded') {
      const generated = await executeConstraintSolving({
        plan: input.constraintTaskPlan, context: input.modelGroundingContext,
        input: input.content, requirement: input.requirement,
        inputHash: input.metadata.inputHash, model: MODEL, apiKey: request.apiKey,
        baseURL: BASE_URL, previous, previousProposal, diagnostics,
      });
      candidate = generated.ocl;
      proposal = generated.audit.proposal;
      issues = generated.issues;
      trace = generated.trace;
      guidedAudit = generated.audit;
      usage = generated.usage;
    } else {
      const messages = [
        new SystemMessage(system),
        new HumanMessage(input.content),
        new HumanMessage(JSON.stringify({
          previousCandidate: previous,
          previousTaskEvidence: taskSolutionSchema.safeParse(previousProposal).success
            ? taskSolutionSchema.parse(previousProposal).taskEvidence : null,
          rawValidatorDiagnostics: diagnostics.map(item => ({
            stage: item.stage, code: item.code, message: item.msg,
            line: item.location.line ?? null, column: item.location.column ?? null,
          })),
        })),
        new HumanMessage('Repair the complete task-solution JSON using the raw validator diagnostics. Keep the task plan, source requirement, model, signature, and rules unchanged.'),
      ];
      trace = generationMessageTrace(String(MODEL), messages);
      try {
        const response = await generateStructuredJsonDetailed({
          model: MODEL, apiKey: request.apiKey, baseURL: BASE_URL, messages, schema: z.unknown(),
        });
        proposal = response.value;
        usage = response.usage;
      } catch (error) {
        if (!(error instanceof StructuredJsonOutputError)) throw error;
        proposal = {invalidModelResponse: error.content};
        usage = error.usage;
      }
      const parsed = taskSolutionSchema.safeParse(proposal);
      if (!parsed.success || parsed.data.planHash !== input.constraintTaskPlan.hash)
        issues = [{code: 'TASK_SOLUTION_SCHEMA', message: 'The repair must return the frozen task-solution envelope.'}];
      else {
        candidate = {...parsed.data.contract, definition: parsed.data.contract.definition ?? ''};
        issues = auditTaskEvidence(
          input.constraintTaskPlan, candidate, parsed.data.taskEvidence, input.modelGroundingContext
        ).issues;
      }
    }
    const changeAudit = auditDirectedRepair(previous, candidate, input.modelGroundingContext, diagnostics);
    const validation = await validateCandidate(row, input, candidate, issues, request.apiKey);
    yield {
      phase: 'repair-attempt', operationId: row.id, arm: request.arm, attempt,
      planHash: input.constraintTaskPlan.hash, requestTrace: trace,
      proposal, candidate, candidateHash: hash(JSON.stringify(candidate)),
      guidedAudit, changeAudit, usage, validation,
      realModelCalls: attempt, hiddenEvaluations: Number(validation.hiddenEvaluated),
    };
    if (validation.preexecValid || !validation.diagnostics.length ||
        validation.diagnostics.some(item => !item.repairEligible)) return;
    previous = candidate;
    previousProposal = proposal;
    diagnostics = validation.diagnostics;
  }
}
