import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadCollaborativeOperation} from '../../src/app/service/crossClauseOperation';
import {compilePackage25} from '../../src/app/service/crossClausePackage25';
import {planDependencyRepair} from '../../src/app/service/dependencyRepairPermissions';
import {dependencyRepairMessages, ordinaryMatchedRepairMessages} from '../../src/app/service/dependencyRepairLoop';
import {executeCrossClauseCollaborative} from '../../src/app/service/crossClauseCollaborative';
import {auditDependencyRepair} from '../../src/app/service/dependencyRepairAudit';
import {auditCollaborative25} from '../../src/app/service/crossClauseCollaborative25';
import {taskSolutionSchema} from '../../src/app/service/constraintSolving';
import {validateDependencyRepairPreExec} from '../../src/app/service/dependencyRepairValidation';
import {permissionAst, astStructureHash} from '../../src/app/service/dependencyRepairAst';
import {PilotBudget, type PilotArm} from '../../src/app/service/crossClausePilotControl';
import {createRepairDirective} from '../../src/app/service/directedRepair';
import type {RepairCandidate} from '../../src/app/service/repairLocalization';

export const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
export function save(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const fd = fs.openSync(file, 'wx');
  try {fs.writeFileSync(fd, JSON.stringify(value, null, 2)); fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
}
const service = 'src/app/service/';
export function verifyFrozen(directory: string) {
  const manifest = read(path.join(directory, 'manifest.json'));
  const files = read(path.join(directory, 'source-hashes.json'));
  assert.equal(hash(JSON.stringify(files)), manifest.sourceManifestSha256);
  for (const [file, digest] of Object.entries(files)) {
    assert.equal(hash(fs.readFileSync(file)), digest, `Source drift: ${file}`);
    assert.equal(hash(fs.readFileSync(path.join(directory, 'snapshot', file))), digest, `Snapshot drift: ${file}`);
  }
  for (const arm of ['ordinary', 'dependency-guided']) {
    const request = read(path.join(directory, arm, 'request.json'));
    assert.equal(hash(JSON.stringify(request)), read(path.join(directory, arm, 'request-integrity.json')).sha256);
    assert.equal(hash(JSON.stringify(request.messages)), request.messagesHash);
  }
  return read(path.join(directory, 'shared.json'));
}
export function buildPilot(directory: string) {
  const shared = verifyFrozen(directory);
  const budget = read(path.join(directory, 'budget.json'));
  assert.equal(budget.priorBudgetSlotsPerArm, 1); assert.equal(budget.maxNewLogicalCallsPerArm, 2); assert.equal(budget.maxNewLogicalCallsPair, 4);
  const {input} = loadCollaborativeOperation(shared.operationId);
  const plan = input.constraintTaskPlan!, context = input.modelGroundingContext;
  const pack = compilePackage25(plan, context);
  assert.deepEqual(plan, shared.plan); assert.deepEqual(context, shared.context); assert.deepEqual(pack, shared.pack);
  assert.equal(input.content, shared.canonicalInput); assert.equal(input.requirement, shared.requirement);
  const source = fs.readFileSync('data/benchmark/cross_clause_m25_v1/cases.jsonl', 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line))
    .find(item => item.id === 'CoCoME_manageStore_queryStore/D-type-vs-Q-result');
  assert.deepEqual(shared.candidate, source.mutated);
  assert.deepEqual(shared.source, source.source);
  const params = {plan, context, input: input.content, requirement: input.requirement,
    inputHash: input.metadata.inputHash, model: shared.model as never, apiKey: 'unused', baseURL: 'https://unused.invalid/v1'};
  const evidence = shared.taskEvidence;
  const permissionInput = {plan, context, pack, candidate: shared.candidate, taskEvidence: evidence};
  const frozenPermission = read(path.join(directory, 'dependency-guided/permission.json'));
  const permission = planDependencyRepair({...permissionInput, optionId: frozenPermission.selectedOption});
  assert.deepEqual(JSON.parse(JSON.stringify(permission)), frozenPermission);
  const current = {...params, previous: shared.candidate, previousProposal: {planHash: plan.hash, contract: shared.candidate, taskEvidence: evidence}, diagnostics: permission.diagnostics};
  const requests = {ordinary: ordinaryMatchedRepairMessages(current, pack), 'dependency-guided': dependencyRepairMessages(current, pack, permission)};
  for (const arm of ['ordinary', 'dependency-guided'] as PilotArm[]) assert.deepEqual(requests[arm].trace, read(path.join(directory, arm, 'request.json')));
  assert.deepEqual(requests.ordinary.trace.messages.slice(0, 3), requests['dependency-guided'].trace.messages.slice(0, 3));
  return {shared, params, pack, permission, requests, frozenDirectory: directory};
}
export type Pilot = ReturnType<typeof buildPilot>;
export type RawResponse = {content: unknown; usage_metadata?: unknown; response_metadata?: unknown; id?: string; serializedSDKMessage?: unknown};
export type PilotTransport = (trace: Pilot['requests']['ordinary']['trace']) => Promise<RawResponse>;
const usage = (response: RawResponse) => {
  const raw = response.usage_metadata as {input_tokens?: number; output_tokens?: number; total_tokens?: number; output_token_details?: {reasoning?: number}} | undefined;
  const metadata = response.response_metadata as {finish_reason?: string; tokenUsage?: {promptTokens?: number; completionTokens?: number; totalTokens?: number}} | undefined;
  return {inputTokens: raw?.input_tokens ?? metadata?.tokenUsage?.promptTokens ?? null, outputTokens: raw?.output_tokens ?? metadata?.tokenUsage?.completionTokens ?? null,
    totalTokens: raw?.total_tokens ?? metadata?.tokenUsage?.totalTokens ?? null, reasoningTokens: raw?.output_token_details?.reasoning ?? null, finishReason: metadata?.finish_reason ?? null};
};
function decode(response: RawResponse) {
  const text = typeof response.content === 'string' ? response.content : Array.isArray(response.content)
    ? response.content.map(item => typeof item === 'object' && item && 'text' in item ? String(item.text) : '').join('\n') : '';
  const body = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = body.indexOf('{'), end = body.lastIndexOf('}');
  return JSON.parse(body.slice(start, end + 1));
}
function astKey(candidate: RepairCandidate, pilot: Pilot) {
  const ast = permissionAst(candidate, pilot.params.context);
  return hash(JSON.stringify(ast.parsed ? Object.values(ast.roots).map(root => astStructureHash(root)) : candidate));
}
export function recoverOnly(directory: string) {
  const unknown: string[] = [];
  for (const arm of ['ordinary', 'dependency-guided']) {
    const root = path.join(directory, arm);
    if (!fs.existsSync(root)) continue;
    for (const step of fs.readdirSync(root).filter(name => /^attempt-\d+$/.test(name))) {
      const base = path.join(root, step);
      let complete = false;
      try {
        const record = read(path.join(base, 'result.json'));
        complete = record.arm === arm && record.attempt === Number(step.slice(8)) && ['evaluated', 'parse-failed'].includes(record.status);
      } catch { /* A partially written result is not proof of completion. */ }
      if (fs.existsSync(path.join(base, 'reservation.json')) && !complete) {
        unknown.push(`${arm}/${step}`);
        const record = path.join(base, 'recovery.json');
        if (!fs.existsSync(record)) save(record, {status: 'unknown', mayHaveConsumedFees: true, retryAllowed: false,
          rawResponsePresent: fs.existsSync(path.join(base, 'raw-response.json'))});
      }
    }
  }
  return {unknown, replayAllowed: false, realModelCalls: 0};
}

export async function executePilot(pilot: Pilot, output: string, transport: PilotTransport, options: {
  mock: boolean; terminal?: (candidate: RepairCandidate) => Promise<unknown>;
  validate?: typeof validateDependencyRepairPreExec;
  afterReservation?: () => void;
  executionMetadata?: unknown;
}): Promise<unknown> {
  assert.ok(options.mock || (!options.terminal && !options.validate && !options.afterReservation), 'Live runs require the canonical backend and no terminal/fault hooks');
  assert.ok(!fs.existsSync(output), 'Existing execution cannot be resumed or reissued; use inspect-only recovery');
  verifyFrozen(pilot.frozenDirectory);
  fs.mkdirSync(output); // Exclusive directory creation prevents concurrent duplicate invocation.
  const budget = new PilotBudget(1, 2, 4);
  save(path.join(output, 'run.json'), {mock: options.mock, frozenDirectory: pilot.frozenDirectory, initialSlots: 1, newPerArm: 2,
    pairCap: 4, sdkMaxRetries: 0, hiddenFeedback: false, status: 'started', executionMetadata: options.executionMetadata ?? null});
  const summaries = [];
  let pairUnknown = false;
  const immutable = hash(JSON.stringify({shared: pilot.shared, params: pilot.params, pack: pilot.pack}));
  for (const arm of ['ordinary', 'dependency-guided'] as PilotArm[]) {
    if (pairUnknown) {
      const summary = {arm, stop: 'pair-infrastructure-unknown-stop', candidate: pilot.shared.candidate, newLogicalCalls: 0, totalSlots: 1};
      save(path.join(output, arm, 'summary.json'), summary); summaries.push(summary); continue;
    }
    let candidate: RepairCandidate = structuredClone(pilot.shared.candidate), evidence = structuredClone(pilot.shared.taskEvidence);
    let proposal: unknown = {planHash: pilot.params.plan.hash, contract: candidate, taskEvidence: evidence};
    let diagnostics = pilot.permission.diagnostics, previous: RepairCandidate | undefined;
    const seen = new Set([astKey(candidate, pilot)]);
    let unchangedRounds = 0, stop: string | null = null;
    let previousFamilies = new Set(diagnostics.map(item => `${item.code}:${item.location.clause ?? ''}`));
    const clearedFamilies = new Set<string>();
    for (let attempt = 1; attempt <= 2 && !stop; attempt++) {
      verifyFrozen(pilot.frozenDirectory);
      assert.equal(hash(JSON.stringify({shared: pilot.shared, params: pilot.params, pack: pilot.pack})), immutable, 'Pilot inputs mutated');
      const permissionInput = {plan: pilot.params.plan, context: pilot.params.context, pack: pilot.pack, candidate, previous, taskEvidence: evidence,
        optionId: attempt === 1 ? pilot.permission.selectedOption : undefined,
        validatorDiagnostics: attempt === 1 ? [] : diagnostics};
      const permission = arm === 'dependency-guided' ? planDependencyRepair(permissionInput) : null;
      const current = {...pilot.params, previous: candidate, previousProposal: proposal, diagnostics};
      const prepared = arm === 'ordinary' ? ordinaryMatchedRepairMessages(current, pilot.pack) : dependencyRepairMessages(current, pilot.pack, permission!);
      if (attempt === 1) assert.deepEqual(prepared.trace, pilot.requests[arm].trace);
      const base = path.join(output, arm, `attempt-${attempt}`);
      const result = (fields: Record<string, unknown>) => save(path.join(base, 'result.json'), {
        arm, attempt, status: null, stop: null, requestHash: hash(JSON.stringify(prepared.trace)),
        previousCandidate: candidate, candidate: null, astDiff: null, protocolAccepted: false,
        permissionPassed: null, scope: null, preexec: null, crossClause: null, usage: null,
        elapsedMs: null, sdkRetries: 0, providerInternalRetries: 'unknown', mayHaveConsumedFees: true,
        introducedDiagnosticFamilies: null, reintroducedDiagnosticFamilies: null, ...fields});
      save(path.join(base, 'request.json'), prepared.trace);
      save(path.join(base, 'permission.json'), permission ?? createRepairDirective(candidate, diagnostics, pilot.params.context));
      assert.equal(hash(JSON.stringify(prepared.trace.messages)), prepared.trace.messagesHash);
      budget.reserve(arm);
      save(path.join(base, 'reservation.json'), {arm, attempt, status: 'reserved-unknown-until-response',
        consumedNewCalls: budget.counts, priorSlots: 1, requestHash: hash(JSON.stringify(prepared.trace)), timestamp: new Date().toISOString()});
      options.afterReservation?.(); // Fault injection occurs before dispatch, but reservation is never refunded.
      assert.deepEqual(read(path.join(base, 'request.json')), prepared.trace, 'Persisted request changed before dispatch');
      const start = performance.now();
      let raw: RawResponse;
      try {
        raw = await transport(structuredClone(prepared.trace));
        save(path.join(base, 'raw-response.json'), raw); // Must precede JSON decoding and any semantic audit.
      } catch {
        stop = budget.complete(arm, {infrastructureUnknown: true, protocolAccepted: false, permissionPassed: false, preexecValid: false, unchangedRounds, cycle: false});
        pairUnknown = true;
        result({arm, attempt, status: 'unknown', stop, requestHash: hash(JSON.stringify(prepared.trace)),
          candidate: null, astDiff: null, protocolAccepted: false, permissionPassed: null, preexec: null, crossClause: null,
          usage: null, elapsedMs: performance.now() - start, mayHaveConsumedFees: true, sdkRetries: 0});
        break;
      }
      let value: unknown;
      try {value = decode(raw);} catch {
        stop = budget.complete(arm, {protocolAccepted: false, permissionPassed: false, preexecValid: false, unchangedRounds, cycle: false});
        result({arm, attempt, status: 'parse-failed', stop, requestHash: hash(JSON.stringify(prepared.trace)), candidate: null,
          astDiff: null, protocolAccepted: false, permissionPassed: null, preexec: null, crossClause: null, usage: usage(raw), elapsedMs: performance.now() - start});
        break;
      }
      assert.equal(hash(JSON.stringify({shared: pilot.shared, params: pilot.params, pack: pilot.pack})), immutable);
      const parsed = taskSolutionSchema.safeParse(value);
      const protocolAccepted = parsed.success && parsed.data.planHash === pilot.params.plan.hash;
      let revised = candidate, permissionPassed = false, scope: unknown = null, crossClause: ReturnType<typeof auditCollaborative25> | null = null;
      let validation: Awaited<ReturnType<typeof validateDependencyRepairPreExec>> | null = null;
      if (protocolAccepted && parsed.success) {
        revised = {...parsed.data.contract, definition: parsed.data.contract.definition ?? ''};
        if (arm === 'ordinary') {
          const ordinary = await executeCrossClauseCollaborative(current, pilot.pack.base, async () => ({value, usage: usage(raw)}));
          scope = {directed: ordinary.scopeAudit, issues: ordinary.issues};
          permissionPassed = !ordinary.scopeAudit?.blocked && !ordinary.issues.some(item => item.code === 'TASK_REPAIR_SCOPE');
        } else {
          const audit = auditDependencyRepair(permission!, permissionInput, revised, parsed.data.taskEvidence);
          scope = audit;
          permissionPassed = audit.permissionPassed;
        }
        crossClause = auditCollaborative25({plan: pilot.params.plan, context: pilot.params.context, candidate: revised, previous: candidate, taskEvidence: parsed.data.taskEvidence}, pilot.pack);
        validation = await (options.validate ?? validateDependencyRepairPreExec)(revised, parsed.data.taskEvidence, pilot.params.plan, pilot.params.context);
      }
      const key = astKey(revised, pilot), same = key === astKey(candidate, pilot);
      unchangedRounds = same ? unchangedRounds + 1 : 0;
      stop = budget.complete(arm, {protocolAccepted, permissionPassed, preexecValid: Boolean(validation?.preexecValid && !crossClause?.blocked),
        unchangedRounds, cycle: !same && seen.has(key)});
      const oldAst = permissionAst(candidate, pilot.params.context), newAst = permissionAst(revised, pilot.params.context);
      const astDiff = Object.keys(oldAst.roots).filter(clause => astStructureHash(oldAst.roots[clause as keyof typeof oldAst.roots]) !== astStructureHash(newAst.roots[clause as keyof typeof newAst.roots]))
        .map(clause => ({clause, before: oldAst.roots[clause as keyof typeof oldAst.roots], after: newAst.roots[clause as keyof typeof newAst.roots]}));
      const nextDiagnostics = [...(crossClause?.diagnostics ?? []), ...(validation?.diagnostics ?? [])];
      const families = new Set(nextDiagnostics.map(item => `${item.code}:${item.location.clause ?? ''}`));
      const introduced = [...families].filter(item => !previousFamilies.has(item));
      for (const item of previousFamilies) if (!families.has(item)) clearedFamilies.add(item);
      const reintroduced = [...families].filter(item => clearedFamilies.has(item));
      result({arm, attempt, status: 'evaluated', stop, requestHash: hash(JSON.stringify(prepared.trace)),
        previousCandidate: candidate, candidate: revised, astDiff, protocolAccepted, permissionPassed, scope,
        preexec: validation, crossClause, usage: usage(raw), elapsedMs: performance.now() - start, sdkRetries: 0, providerInternalRetries: 'unknown',
        introducedDiagnosticFamilies: introduced, reintroducedDiagnosticFamilies: reintroduced});
      seen.add(key); previous = candidate; candidate = revised; proposal = value;
      if (parsed.success) evidence = parsed.data.taskEvidence;
      diagnostics = nextDiagnostics; previousFamilies = families;
    }
    save(path.join(output, arm, 'summary.json'), {arm, stop, candidate, newLogicalCalls: budget.counts[arm], totalSlots: 1 + budget.counts[arm]});
    summaries.push({arm, stop, newLogicalCalls: budget.counts[arm]});
  }
  // Optional terminal evaluation is deliberately outside BOTH generation loops.
  // Production CLI does not install this callback; tests can prove non-feedback.
  if (options.terminal) for (const arm of ['ordinary', 'dependency-guided']) {
    const summary = read(path.join(output, arm, 'summary.json'));
    if (summary.stop === 'preexec-valid') save(path.join(output, arm, 'terminal.json'), await options.terminal(summary.candidate));
  }
  const result = {mock: options.mock, realModelCalls: options.mock ? 0 : budget.counts.ordinary + budget.counts['dependency-guided'],
    paidCalls: options.mock ? 0 : pairUnknown ? null : budget.counts.ordinary + budget.counts['dependency-guided'],
    logicalCallReservations: budget.counts, providerBillingRequests: 'unknown', hiddenJestEvaluations: 0, summaries};
  save(path.join(output, 'summary.json'), result);
  return result;
}

export const adapterSourceFiles = ['scripts/lib/m4LiveAdapter.ts', 'scripts/run_cross_clause_m4_live.ts',
  `${service}crossClausePilotControl.ts`];
