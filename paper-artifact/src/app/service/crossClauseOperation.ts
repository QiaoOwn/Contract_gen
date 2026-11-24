import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {OpenAIChatModelId} from '@langchain/openai';
import {buildOperationInput} from './createOperationInput';
import {compileCrossClauseConstraints, assertCrossClausePackage} from './crossClauseConstraintCompiler';
import {executeCrossClauseCollaborative, prepareCollaborativeRequest, type CollaborativeTransport} from './crossClauseCollaborative';
import {executeConstraintSolving, taskSolutionSchema} from './constraintSolving';
import {checkCrossClauseAcceptance} from './crossClauseAcceptance';
import {auditTaskEvidence, taskSolutionDiagnostics, type TaskSolutionIssue} from './constraintTaskPlan';
import {graph} from './graph';
import {createRepairProtocol} from './developmentBehavior/developmentRepair';
import {captureReadOnlyRepairEvidence, assertReadOnlyRepairEvidence} from './repairIntegrity';
import type {RepairCandidate} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';
import {buildStaticCrossClauseGraph, ccHash} from './crossClauseGraph';

export const collaborativeOperationSchema = z.object({
  operationId: z.string(), model: z.string().min(1), apiKey: z.string().min(1),
  mode: z.enum(['constraintSolving', 'crossClauseCollaborative']).default('constraintSolving'),
  maxAttempts: z.number().int().min(1).max(5).default(5),
  prepareOnly: z.boolean().default(false), controlledDuplicate: z.boolean().default(false),
}).strict();
const INPUT = 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl';
export function loadCollaborativeOperation(operationId: string) {
  const bytes = fs.readFileSync(INPUT);
  const rows = bytes.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map(row => row.id)).size !== 114) throw new Error('Expected frozen 114-operation input');
  const row = rows.find(row => row.id === operationId);
  if (!row) throw new Error('Operation missing from frozen input');
  const input = buildOperationInput({project: row.project, useCase: row.useCase, operation: row.operation_name,
    userInput: row.description, constraintSolving: true});
  if (input.constraintTaskPlan!.hash !== row.constraint_task_plan_hash || input.content !== row.canonical_user_message ||
      input.metadata.inputHash !== row.input_hash || input.metadata.contextHash !== row.context_hash) throw new Error('Frozen v4 input drift');
  return {row, input, inputSha256: createHash('sha256').update(bytes).digest('hex')};
}

export function controlledDuplicateCandidate(operationId: string) {
  if (operationId !== 'CoCoME_manageStore_queryStore') throw new Error('Controlled duplicate is limited to the reviewed queryStore example');
  const fixture = fs.readFileSync('data/benchmark/cross_clause_m0_v1/cases.jsonl', 'utf8').trim().split(/\r?\n/)
    .map(line => JSON.parse(line)).find(item => item.id === operationId);
  const candidate: RepairCandidate = {...fixture.legalCandidate,
    definition: `${fixture.legalCandidate.definition}, ${fixture.legalCandidate.definition}`};
  return {candidate, origin: 'controlled duplicate mutation of historical v4 candidate; not a fresh model output'};
}

export async function validateSeededCollaborativeCandidate(loaded: ReturnType<typeof loadCollaborativeOperation>,
  candidate: RepairCandidate, issues: TaskSolutionIssue[], model: string, apiKey: string) {
  const {row, input} = loaded;
  const state = {project: row.project, useCase: row.useCase, operation: row.operation_name,
    model: model as OpenAIChatModelId, apiKey, oracleProfile: 'rm2pt-authoritative-preparation-v4' as const,
    developmentBehavior: false, developmentRequirement: input.requirement, feedbackMode: 'full' as const,
    maxGenerationAttempts: 1, generationCount: 1, ocl: candidate,
    constraintTaskPlan: input.constraintTaskPlan!, taskSolutionIssues: issues, taskSolutionAudit: null,
    generationTaskPlan: null, semanticContractPlan: null, repairProtocol: createRepairProtocol(false),
    inputMetadata: input.metadata, modelGroundingContext: input.modelGroundingContext,
    messages: [{role: 'user', content: input.content}]};
  const snapshot = captureReadOnlyRepairEvidence(state, []);
  const events: unknown[] = [];
  let terminal: Record<string, unknown> | null = null;
  const diagnostics: RepairDiagnostic[] = [];
  for await (const event of await graph.stream({...state, readOnlyRepairEvidence: snapshot}, {recursionLimit: 12})) {
    if ('OCL Generator' in event) throw new Error('Seeded validation unexpectedly generated a candidate');
    events.push(event);
    for (const name of ['Contract Generator', 'TypeScript Generator', 'TypeScript Parser'] as const) {
      const node = event[name] as {repairDiagnostics?: RepairDiagnostic[]} | undefined;
      if (node?.repairDiagnostics?.length) diagnostics.push(...node.repairDiagnostics);
    }
    if ('Test Result' in event) terminal = event['Test Result'] as Record<string, unknown>;
  }
  assertReadOnlyRepairEvidence(snapshot, state);
  if (Boolean(terminal) === Boolean(diagnostics.length)) throw new Error('Validation did not end at diagnostics or terminal evaluation');
  // Hidden outcomes are returned separately and never converted to repair diagnostics.
  return {preexecValid: Boolean(terminal), diagnostics, events,
    terminalEvidence: terminal ? {hiddenEvaluations: 1, hiddenPassed: Boolean((terminal.result as {success?: boolean})?.success),
      methodAccepted: terminal.methodAccepted === true} : null};
}

export async function* runCollaborativeOperation(value: unknown, testDrivers?: {
  transport?: CollaborativeTransport; validate?: typeof validateSeededCollaborativeCandidate;
}) {
  const request = collaborativeOperationSchema.parse(value);
  const loaded = loadCollaborativeOperation(request.operationId);
  const {input} = loaded;
  const plan = input.constraintTaskPlan!;
  const pack = request.mode === 'crossClauseCollaborative' ? compileCrossClauseConstraints(plan, input.modelGroundingContext) : null;
  const params = {plan, context: input.modelGroundingContext, input: input.content, requirement: input.requirement,
    inputHash: input.metadata.inputHash, model: request.model as OpenAIChatModelId, apiKey: request.apiKey,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.apiyi.com/v1'};
  const immutableState = {modelGroundingContext: input.modelGroundingContext, inputMetadata: input.metadata,
    developmentRequirement: input.requirement, constraintTaskPlan: plan, messages: [{content: input.content}]};
  const snapshot = captureReadOnlyRepairEvidence(immutableState, []);
  const authorized = () => {assertReadOnlyRepairEvidence(snapshot, immutableState);
    if (createHash('sha256').update(fs.readFileSync(INPUT)).digest('hex') !== loaded.inputSha256)
      throw new Error('Frozen input file changed during generation');
    if (pack) assertCrossClausePackage(pack, plan, input.modelGroundingContext);};
  yield {phase: 'prepared', mode: request.mode, inputSha256: loaded.inputSha256, input: input.content,
    plan, staticGraph: pack ? buildStaticCrossClauseGraph(plan, input.modelGroundingContext) : null,
    package: pack, model: request.model, maxAttempts: request.maxAttempts,
    outputProtocol: 'unchanged-v4-task-solution-envelope', modelCalls: 0, hiddenEvaluations: 0};
  if (request.prepareOnly) return;
  let previous: RepairCandidate | undefined;
  let previousProposal: unknown;
  let diagnostics: RepairDiagnostic[] = [];
  if (request.controlledDuplicate) {
    if (!pack) throw new Error('Controlled demonstration requires collaborative mode');
    const seed = controlledDuplicateCandidate(request.operationId);
    const acceptance = checkCrossClauseAcceptance({pack, plan, context: input.modelGroundingContext, candidate: seed.candidate});
    if (!acceptance.blocked || !acceptance.diagnostics.length) throw new Error('Controlled duplicate was not rejected');
    previous = seed.candidate; diagnostics = acceptance.diagnostics;
    previousProposal = {planHash: plan.hash, contract: previous, taskEvidence: plan.tasks.map(task =>
      ({taskId: task.id, expression: task.clause === 'precondition' ? previous!.precondition : previous!.postcondition}))};
    yield {phase: 'controlled-seed-rejected', ...seed, acceptance, modelCalls: 0, hiddenEvaluations: 0};
  }
  for (let attempt = 1; attempt <= request.maxAttempts; attempt++) {
    authorized();
    const currentParams = {...params, previous, previousProposal, diagnostics};
    if (pack) yield {phase: 'model-call-started', attempt, packageHash: pack.hash,
      requestTrace: prepareCollaborativeRequest(currentParams, pack).trace};
    const started = performance.now();
    const generated = pack ? await executeCrossClauseCollaborative(currentParams, pack, testDrivers?.transport) : null;
    const legacy = pack ? null : await executeConstraintSolving(currentParams);
    authorized();
    const candidate = generated ? generated.candidate : legacy!.ocl;
    const proposal = generated ? generated.proposal : legacy!.audit.proposal;
    const issues = generated ? generated.issues : legacy!.issues;
    const parsed = taskSolutionSchema.safeParse(proposal);
    const crossAcceptance = generated?.acceptance ?? null;
    const scopeBlocked = issues.some(issue => issue.code === 'TASK_REPAIR_SCOPE');
    const packageBlocked = Boolean(crossAcceptance?.blocked);
    const validation = packageBlocked || issues.length ? null :
      await (testDrivers?.validate ?? validateSeededCollaborativeCandidate)(loaded, candidate, issues, request.model, request.apiKey);
    yield {phase: 'candidate-evaluated', attempt, candidate, previousCandidateHash: previous ? ccHash(previous) : null,
      candidateHash: ccHash(candidate), changed: previous ? ccHash(candidate) !== ccHash(previous) : null,
      proposal, requestTrace: generated?.trace ?? legacy!.trace, packageHash: pack?.hash ?? null,
      crossAcceptance, protocolIssues: issues, scopeAudit: generated?.scopeAudit ?? legacy?.scopeAudit,
      usage: generated?.usage ?? legacy!.usage, latencyMs: performance.now() - started,
      logicalModelCalls: attempt, providerRetryAttemptsObservable: false,
      preexecValid: validation?.preexecValid ?? false, backendDiagnostics: validation?.diagnostics ?? [],
      backendEvents: validation?.events ?? [], terminalEvidence: validation?.terminalEvidence ?? null};
    if (validation?.preexecValid) return;
    if (scopeBlocked) return; // Existing repair guards stop protected-region changes.
    diagnostics = [...taskSolutionDiagnostics(plan, issues), ...(crossAcceptance?.diagnostics ?? []), ...(validation?.diagnostics ?? [])];
    if (!diagnostics.length || diagnostics.some(item => !item.repairEligible)) return;
    previous = candidate; previousProposal = parsed.success ? parsed.data : proposal;
  }
}
