import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {hash, read, save} from './m4LiveAdapter';
import {PilotBudget} from '../../src/app/service/crossClausePilotControl';
import {ccHash} from '../../src/app/service/crossClauseGraph';
import {prepareStage5Arm, finalizeStage5B, evaluateStage5Public, type Stage5Arm} from './contractgenStage5';
import {NARRATIVE_BASELINE_PATH, verifyNarrativeBaseline} from '../../src/app/service/narrativeBaseline';
import {studyResultUnits} from './narrativeStudyResults';

export const stage6Source = 'results/contractgen-stage5-preflight-v1';
export const stage6Slots = () => read(`${stage6Source}/pilot-plan.json`).pilot.flatMap((id: string) =>
  ['A', 'B-extract', 'B-generate', 'C', 'D', 'E'].map(step => `${id}__${step}`)) as string[];
export type Messages6 = {role: string; content: string}[];
export type Response6 = {content: string; raw: unknown; model: string; id?: string;
  inputTokens: number | null; outputTokens: number | null; reasoningTokens: number | null; finishReason: string | null};
export type Transport6 = (messages: Messages6) => Promise<Response6>;
export function inputs6(id: string) {
  assert(read(`${stage6Source}/pilot-plan.json`).pilot.includes(id));
  const row = fs.readFileSync('data/narrative_v3_114/generation/requirements.jsonl', 'utf8').trim().split(/\r?\n/)
    .map(line => JSON.parse(line)).find(row => row.operationId === id);
  const context = read(`data/narrative_v3_114/generation/models/${id}/typed-model.json`);
  return {input: {operationId: id, narrativeRequirement: row.description, sourceHash: ccHash(row.description),
    parameters: context.index.operation.parameters.map((p: {name: string}) => p.name),
    modelTypes: context.index.entities.map((e: {name: string}) => e.name)}, context};
}
export function verify6(preview: string) {
  const identity = read(`${preview}/identity.json`);
  assert(!(identity.freezeDrift?.length), 'Protected freeze drift requires resolution before live execution');
  assert.equal(identity.maxLogicalCalls, 18);
  assert.equal(identity.sdkRetries, 0);
  for (const [file, digest] of Object.entries(identity.files)) assert.equal(hash(fs.readFileSync(file)), digest, `Frozen file changed: ${file}`);
  return identity;
}
export async function preview6(output: string, coveragePath = 'results/contractgen-stage6a-preparation-v6/oracle-coverage.json') {
  assert(!fs.existsSync(output), 'Use a new preview directory');
  const files = fs.existsSync(NARRATIVE_BASELINE_PATH) ? {...verifyNarrativeBaseline().files,
    [NARRATIVE_BASELINE_PATH]: hash(fs.readFileSync(NARRATIVE_BASELINE_PATH))} : {...read('results/contractgen-stage5-freeze-v1/frozen-files.json')};
  for (const file of ['scripts/lib/contractgenStage5.ts', 'scripts/lib/contractgenStage6.ts',
    'scripts/run_contractgen_stage6.ts', 'scripts/prepare_contractgen_stage6.ts', 'scripts/evaluate_contractgen_stage6.ts',
    'scripts/test_contractgen_stage6.ts', 'scripts/lib/contractgenStage6Evidence.ts', coveragePath,
    'config/contractgen-stage5-error-taxonomy.json', `${stage6Source}/pilot-plan.json`]) files[file] = hash(fs.readFileSync(file));
  const hashes: Record<string, unknown> = {};
  for (const id of read(`${stage6Source}/pilot-plan.json`).pilot) {
    const {input, context} = inputs6(id);
    const common = new Set<string>();
    for (const arm of ['A', 'B', 'C', 'D', 'E'] as Stage5Arm[]) {
      const recordPath = `${stage6Source}/requests/${id}/${arm}.json`;
      const frozen = read(recordPath), actual = prepareStage5Arm(input, context, arm);
      assert.equal(hash(JSON.stringify(frozen.messages)), frozen.requestHash);
      assert.deepEqual(actual.messages, frozen.messages);
      assert.deepEqual(actual.extractionRequest, frozen.extractionRequest);
      files[recordPath] = hash(fs.readFileSync(recordPath));
      common.add(actual.commonHash);
      hashes[`${id}/${arm}`] = {joint: actual.requestHash,
        extraction: actual.extractionRequest ? hash(JSON.stringify(actual.extractionRequest)) : null,
        BFinal: arm === 'B' ? 'runtime-bound-to-own-extraction; not yet instantiated' : null};
    }
    assert.equal(common.size, 1);
  }
  const freezeDrift: {file: string; status: string}[] = [];
  const queue = Object.entries(files);
  let next = 0;
  await Promise.all(Array.from({length: 16}, async () => {
    while (next < queue.length) {
      const [file, digest] = queue[next++];
      try {
        const calculated = await new Promise<string>((resolve, reject) => {
          const sum = createHash('sha256'), stream = fs.createReadStream(file);
          stream.on('data', chunk => sum.update(chunk)); stream.on('error', reject);
          stream.on('end', () => resolve(sum.digest('hex')));
        });
        if (calculated !== digest) freezeDrift.push({file, status: 'changed'});
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') freezeDrift.push({file, status: 'missing'});
        else throw error;
      }
    }
  }));
  freezeDrift.sort((a, b) => a.file.localeCompare(b.file));
  const identity = {version: 'contractgen-stage6a-v1', slots: stage6Slots(), maxLogicalCalls: 18, sdkRetries: 0,
    sampling: read(`${stage6Source}/pilot-plan.json`).sampling, timeoutMs: 120000,
    source: stage6Source, files, freezeDrift, coveragePath, requestHashes: hashes, provisional: true, hiddenFeedback: false};
  save(`${output}/identity.json`, identity);
  save(`${output}/request-hashes.json`, hashes);
  save(`${output}/authorization-draft.json`, {approved: false, acknowledgement: 'AUTHORIZE_STAGE6_FIXED_18_CALLS',
    identitySha256: hash(JSON.stringify(identity)), endpointSha256: null, outputDirectory: null, expiresAt: null});
  return {identitySha256: hash(JSON.stringify(identity)), maxLogicalCalls: 18, freezeDrift,
    liveEligible: freezeDrift.length === 0, realModelCalls: 0, paidCalls: 0, hiddenJestEvaluations: 0};
}

export async function reserved6(output: string, slot: string, messages: Messages6, expected: string, transport: Transport6) {
  const run = read(`${output}/run.json`);
  assert(run.slots.includes(slot), 'Unknown call slot');
  assert.equal(hash(JSON.stringify(messages)), expected, 'Request drift');
  assert(!fs.existsSync(`${output}/generation-seal.json`), 'Generation already sealed');
  const lock = fs.openSync(`${output}/.lock`, 'wx');
  const root = `${output}/${slot}`;
  try {
    let count = 0;
    for (const other of run.slots) {
      const folder = `${output}/${other}`;
      if (fs.existsSync(`${folder}/reservation.json`)) {
        count++;
        assert(fs.existsSync(`${folder}/outcome.json`), 'Prior reservation incomplete; inspect only, no retry');
        assert.notEqual(read(`${folder}/outcome.json`).status, 'unknown', 'Unknown call stops the run');
      }
    }
    assert(count < 18, '18-call cap exhausted');
    assert(!fs.existsSync(root), 'Slot cannot be replayed or refunded');
    const single = new PilotBudget(0, 1, 2); single.reserve('ordinary');
    save(`${root}/request.json`, messages);
    save(`${root}/reservation.json`, {slot, requestHash: expected, reservedAt: new Date().toISOString(), refundable: false});
  } finally {fs.closeSync(lock); fs.unlinkSync(`${output}/.lock`);}
  const started = performance.now();
  let response: Response6;
  try {
    assert.equal(hash(JSON.stringify(read(`${root}/request.json`))), expected);
    response = await transport(structuredClone(messages));
    save(`${root}/raw-response.json`, response);
  } catch (error) {
    save(`${root}/outcome.json`, {status: 'unknown', error: String(error), latencyMs: performance.now() - started,
      mayHaveConsumedFees: !run.mock, retryAllowed: false});
    throw error;
  }
  try {
    assert(response.finishReason === 'stop', 'Incomplete or unsupported provider completion');
    const value = JSON.parse(response.content);
    save(`${root}/outcome.json`, {status: 'received', latencyMs: performance.now() - started,
      model: response.model, id: response.id ?? null, inputTokens: response.inputTokens, outputTokens: response.outputTokens,
      reasoningTokens: response.reasoningTokens, finishReason: response.finishReason});
    return value;
  } catch (error) {
    save(`${root}/outcome.json`, {status: 'protocol-invalid', error: String(error), latencyMs: performance.now() - started,
      failureType: Number((response.raw as {status?: number})?.status) >= 400 ? 'provider-http-error' : 'response-protocol',
      inputTokens: response.inputTokens, outputTokens: response.outputTokens, finishReason: response.finishReason});
    throw error;
  }
}

export function seal6(output: string) {
  const run = read(`${output}/run.json`);
  const entries: Record<string, string> = {};
  for (const slot of run.slots) {
    const base = `${output}/${slot}`;
    if (fs.existsSync(`${base}/skipped.json`)) entries[`${base}/skipped.json`] = hash(fs.readFileSync(`${base}/skipped.json`));
    else {
      assert(fs.existsSync(`${base}/outcome.json`), 'Generation not complete');
      assert.notEqual(read(`${base}/outcome.json`).status, 'unknown', 'Unknown call cannot be silently evaluated');
      for (const file of ['request.json', 'reservation.json', 'raw-response.json', 'outcome.json']) entries[`${base}/${file}`] = hash(fs.readFileSync(`${base}/${file}`));
    }
  }
  const responseFiles = fs.readdirSync(output).filter(name => name.endsWith('.candidate.json'));
  for (const name of responseFiles) entries[`${output}/${name}`] = hash(fs.readFileSync(`${output}/${name}`));
  for (const name of fs.readdirSync(output).filter(name => name.endsWith('__B-final-binding.json')))
    entries[`${output}/${name}`] = hash(fs.readFileSync(`${output}/${name}`));
  save(`${output}/generation-seal.json`, {entries, runHash: hash(JSON.stringify(run))});
}
export function assertSealed6(output: string) {
  const seal = read(`${output}/generation-seal.json`);
  assert.equal(hash(JSON.stringify(read(`${output}/run.json`))), seal.runHash);
  for (const [file, digest] of Object.entries(seal.entries)) assert.equal(hash(fs.readFileSync(file)), digest, 'Sealed evidence changed');
}
export async function terminal6(output: string, evaluate: () => Promise<unknown>) {
  assertSealed6(output);
  assert(!fs.existsSync(`${output}/terminal-reservation.json`), 'Terminal evaluation already reserved');
  save(`${output}/terminal-reservation.json`, {reserved: true, feedbackToGeneration: false});
  const result = await evaluate();
  assertSealed6(output);
  save(`${output}/terminal.json`, result);
  return result;
}

export function diagnostics6(evaluation: Awaited<ReturnType<typeof evaluateStage5Public>>, observations: {
  category: string; verdict: 'witnessed-satisfied' | 'witnessed-violation' | 'unresolved'; evidence: unknown[];
}[] = []) {
  const categories = read('config/contractgen-stage5-error-taxonomy.json');
  const ids = ['CG-OMISSION', 'CG-CLAUSE', 'CG-BRANCH', 'CG-TARGET', 'CG-CREATE-USE', 'CG-PARAMETER', 'CG-STATE', 'CG-CONTRACT'];
  for (const item of observations) {assert(ids.includes(item.category)); assert(item.evidence.length > 0, 'Witness needs evidence');}
  return {publicProtocolValid: evaluation.publicProtocolValid, structural: evaluation.evaluation,
    astEvidence: evaluation.evaluation?.deterministicConflicts ?? [],
    business: ids.map(id => ({id, observations: observations.filter(item => item.category === id),
      assessment: observations.some(item => item.category === id) ? 'finite-observations-only' : 'not-assessed',
      unresolvedCountsAsSuccessOrFailure: false})), taxonomyVersion: categories.version ?? 'stage5',
    wholeRequirementCorrectness: 'not-proven', taskEvidenceUsedAsCorrectness: false};
}

export async function execute6(preview: string, output: string, transport: Transport6, mock: boolean,
  live?: {authorization: unknown; endpoint: string}) {
  if (!mock) {assert(live, 'Live execution requires explicit authorization'); authorize6(preview, output, live.authorization, live.endpoint);}
  const identity = verify6(preview);
  assert(!fs.existsSync(output), 'Execution cannot be replayed; inspect unknown runs only');
  fs.mkdirSync(output, {recursive: true});
  save(`${output}/run.json`, {identitySha256: hash(JSON.stringify(identity)), previewDirectory: path.resolve(preview), slots: identity.slots, mock,
    maxLogicalCalls: 18, sdkRetries: 0, hiddenFeedback: false});
  try {
  for (const id of read(`${stage6Source}/pilot-plan.json`).pilot) {
    const {input, context} = inputs6(id);
    for (const arm of ['A', 'B', 'C', 'D', 'E'] as Stage5Arm[]) {
      verify6(preview);
      const request = prepareStage5Arm(input, context, arm);
      let messages = request.messages;
      if (arm === 'B') {
        try {
          const own = await reserved6(output, `${id}__B-extract`, request.extractionRequest!,
            identity.requestHashes[`${id}/B`].extraction, transport);
          messages = finalizeStage5B(input, context, request, own);
        } catch (error) {
          const base = `${output}/${id}__B-extract`;
          if (!fs.existsSync(`${base}/outcome.json`) || read(`${base}/outcome.json`).status === 'unknown') throw error;
          save(`${output}/${id}__B-generate/skipped.json`, {reason: 'own extraction invalid', error: String(error)});
          continue;
        }
      }
      const slot = `${id}__${arm === 'B' ? 'B-generate' : arm}`;
      const expected = arm === 'B' ? hash(JSON.stringify(messages)) : identity.requestHashes[`${id}/${arm}`].joint;
      if (arm === 'B') save(`${output}/${id}__B-final-binding.json`, {requestHash: expected,
        ownRawResponseHash: hash(fs.readFileSync(`${output}/${id}__B-extract/raw-response.json`))});
      try {
        const value = await reserved6(output, slot, messages, expected, transport);
        save(`${output}/${id}__${arm}.candidate.json`, {id, arm, value});
      } catch (error) {
        if (!fs.existsSync(`${output}/${slot}/outcome.json`) || read(`${output}/${slot}/outcome.json`).status !== 'protocol-invalid') throw error;
      }
    }
  }
  }
  catch (error) {
    save(`${output}/study-unit-summary.json`, {units: studyResultUnits(output, read(`${stage6Source}/pilot-plan.json`).pilot),
      status: 'generation-interrupted', oracleEvaluations: 0, error: String(error)});
    throw error;
  }
  seal6(output);
  save(`${output}/study-unit-summary.json`, {units: studyResultUnits(output, read(`${stage6Source}/pilot-plan.json`).pilot),
    status: 'generation-sealed', oracleEvaluations: 0});
  return {sealed: true, plannedMaximum: 18, realModelCalls: mock ? 0 : 'see reservations', hiddenJestEvaluations: 0};
}

export function authorize6(preview: string, output: string, authorization: unknown, endpoint: string) {
  const identity = verify6(preview);
  const auth = authorization as {approved?: boolean; acknowledgement?: string; identitySha256?: string; endpointSha256?: string; outputDirectory?: string; expiresAt?: string};
  assert.equal(auth.approved, true);
  assert.equal(auth.acknowledgement, 'AUTHORIZE_STAGE6_FIXED_18_CALLS');
  assert.equal(auth.identitySha256, hash(JSON.stringify(identity)));
  assert.equal(auth.endpointSha256, hash(endpoint));
  assert.equal(auth.outputDirectory, path.resolve(output));
  assert(Date.parse(auth.expiresAt ?? '') > Date.now(), 'Authorization expired');
  const url = new URL(endpoint);
  assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash, 'Invalid endpoint');
  assert(!fs.existsSync(output), 'Existing run cannot be retried');
  return identity;
}

// Construct only after explicit authorization. No SDK, connection probe or automatic retry.
export function httpTransport6(endpoint: string, apiKey: string, sampling: {model: string; temperature: number; maxOutputTokens: number}, timeoutMs = 120000): Transport6 {
  return async messages => {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`},
      body: JSON.stringify({model: sampling.model, temperature: sampling.temperature, max_tokens: sampling.maxOutputTokens,
        messages, response_format: {type: 'json_object'}}), signal: AbortSignal.timeout(timeoutMs)});
    const rawText = await response.text();
    // Keep even HTTP error/malformed provider bodies as received evidence before parsing.
    let raw: any;
    try {raw = JSON.parse(rawText);} catch {return {content: '', raw: {status: response.status, rawText}, model: sampling.model,
      inputTokens: null, outputTokens: null, reasoningTokens: null, finishReason: 'provider-malformed'};}
    return {content: response.ok ? raw.choices?.[0]?.message?.content ?? '' : '', raw: {status: response.status, body: raw},
      model: raw.model ?? sampling.model, id: raw.id, inputTokens: raw.usage?.prompt_tokens ?? null,
      outputTokens: raw.usage?.completion_tokens ?? null, reasoningTokens: raw.usage?.completion_tokens_details?.reasoning_tokens ?? null,
      finishReason: raw.choices?.[0]?.finish_reason ?? null};
  };
}
