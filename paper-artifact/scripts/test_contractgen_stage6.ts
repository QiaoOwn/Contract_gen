import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {hash, read, save} from './lib/m4LiveAdapter';
import {stage6Source, stage6Slots, inputs6, execute6, reserved6, seal6, terminal6, assertSealed6,
  authorize6, verify6, diagnostics6, type Response6} from './lib/contractgenStage6';
import {evaluateStage5Public} from './lib/contractgenStage5';
import {structuralEvidence6} from './lib/contractgenStage6Evidence';

async function main() {
  const out = process.argv[2] ?? 'results/contractgen-stage6a-tests-v1';
  assert(!fs.existsSync(out));
  const checks: string[] = [];
  const mock = (value: unknown): Response6 => ({content: JSON.stringify(value), raw: {mock: true}, model: 'mock',
    inputTokens: 11, outputTokens: 7, reasoningTokens: 0, finishReason: 'stop'});
  const requests: Record<string, unknown> = {};
  for (const id of read(`${stage6Source}/pilot-plan.json`).pilot) for (const arm of ['A', 'B', 'C', 'D', 'E']) {
    const record = read(`${stage6Source}/requests/${id}/${arm}.json`);
    requests[`${id}/${arm}`] = {joint: record.requestHash, extraction: record.extractionRequest ? hash(JSON.stringify(record.extractionRequest)) : null};
  }
  const preview = `${out}/mock-preview`;
  // Small deterministic fixture identity; the preparation command separately verifies the full protected manifest.
  const identity = {maxLogicalCalls: 18, sdkRetries: 0, slots: stage6Slots(), files: {}, requestHashes: requests};
  save(`${preview}/identity.json`, identity);
  let calls = 0;
  await assert.rejects(execute6(preview, `${out}/forbidden`, async () => {calls++; return mock({});}, false));
  assert.equal(calls, 0); checks.push('Live execution denied without authorization before any transport');
  const expired = {approved: true, acknowledgement: 'AUTHORIZE_STAGE6_FIXED_18_CALLS',
    identitySha256: hash(JSON.stringify(identity)), endpointSha256: hash('https://example.invalid/v1'),
    outputDirectory: path.resolve(`${out}/live`), expiresAt: '2000-01-01T00:00:00Z'};
  assert.throws(() => authorize6(preview, `${out}/live`, expired, 'https://example.invalid/v1'));
  checks.push('Expired authorization rejected');
  assert.throws(() => authorize6(preview, `${out}/live`, {...expired, identitySha256: 'wrong'}, 'https://example.invalid/v1'));
  checks.push('Authorization must bind frozen request and source identity');
  const run = `${out}/full-mock`;
  const seen: {messages: unknown; value: unknown}[] = [];
  await execute6(preview, run, async messages => {
    calls++;
    const body = JSON.parse(messages[1].content), id = body.operationId;
    if (messages[0].content.startsWith('Decompose')) {
      const {input} = inputs6(id), text = input.narrativeRequirement.slice(0, input.narrativeRequirement.indexOf('.') + 1);
      const value = {sourceHash: input.sourceHash, obligations: [{taskId: `${id}/narrative-task/own-mock`, category: 'unresolved',
        obligationText: text, sourceSpans: [{start: 0, end: text.length, exactText: text}], referencedRoles: [], referencedParameters: [],
        extractionStatus: 'ambiguous', provenance: ['own-mock-only'], rationale: 'Own exact source fixture'}]};
      seen.push({messages, value}); return mock(value);
    }
    if (body.OwnModelDecomposition) {
      assert.deepEqual(body.OwnModelDecomposition, seen.at(-1)!.value);
      assert(!body.Tn && !body.GenerationR && !body.K);
    }
    return mock({contract: {definition: null, precondition: 'true', postcondition: 'true'}});
  }, true);
  assert.equal(calls, 18); checks.push('Complete 3-operation five-arm Mock run consumes exactly 18 logical slots');
  checks.push('All three B second calls use their own first actual Mock response, not program Tn');
  assertSealed6(run); checks.push('Raw responses, requests, outcomes and all 15 candidates sealed');
  let terminal = 0;
  await terminal6(run, async () => {terminal++; return {mock: true, passed: false};});
  assert.equal(calls, 18); assert.equal(terminal, 1); checks.push('Terminal failure never causes generation');
  await assert.rejects(terminal6(run, async () => {terminal++; return {};}));
  checks.push('Terminal reservation forbids duplicate evaluation');
  const messages = [{role: 'user', content: 'mock'}], digest = hash(JSON.stringify(messages));
  const init = (name: string, slots = ['one', 'two']) => {const d = `${out}/${name}`; save(`${d}/run.json`, {slots, mock: true}); return d;};
  const single = init('single');
  await assert.rejects(terminal6(single, async () => {terminal++; return {};}));
  checks.push('Oracle cannot run before complete response seal');
  await assert.rejects(reserved6(single, 'one', messages, 'wrong', async () => mock({})));
  assert(!fs.existsSync(`${single}/one`)); checks.push('Request drift rejected before reservation or dispatch');
  await reserved6(single, 'one', messages, digest, async () => mock({}));
  await assert.rejects(reserved6(single, 'one', messages, digest, async () => mock({})));
  checks.push('Reserved slots cannot replay or refund');
  const unknown = init('unknown');
  await assert.rejects(reserved6(unknown, 'one', messages, digest, async () => {throw new Error('simulated timeout');}));
  assert.equal(read(`${unknown}/one/outcome.json`).status, 'unknown');
  await assert.rejects(reserved6(unknown, 'two', messages, digest, async () => mock({})));
  checks.push('Unknown dispatch state stops subsequent slots without retry');
  const interrupted = init('interrupted'); save(`${interrupted}/one/reservation.json`, {reserved: true});
  await assert.rejects(reserved6(interrupted, 'two', messages, digest, async () => mock({})));
  checks.push('Crash after reservation permits inspection only');
  const invalid = init('invalid');
  await assert.rejects(reserved6(invalid, 'one', messages, digest, async () => ({...mock({}), content: '{'})));
  assert(fs.existsSync(`${invalid}/one/raw-response.json`));
  assert.equal(read(`${invalid}/one/outcome.json`).status, 'protocol-invalid'); checks.push('Malformed response preserved before parse failure');
  const truncated = init('truncated');
  await assert.rejects(reserved6(truncated, 'one', messages, digest, async () => ({...mock({}), finishReason: 'length'})));
  checks.push('Incomplete completion cannot silently become a valid candidate');
  const cap = init('budget', Array.from({length: 19}, (_, i) => `s${i}`));
  for (let i = 0; i < 18; i++) {save(`${cap}/s${i}/reservation.json`, {}); save(`${cap}/s${i}/outcome.json`, {status: 'received'});}
  await assert.rejects(reserved6(cap, 's18', messages, digest, async () => mock({})));
  checks.push('Global cap rejects nineteenth reservation');
  const candidateFile = `${run}/${read(`${stage6Source}/pilot-plan.json`).pilot[0]}__A.candidate.json`;
  fs.appendFileSync(candidateFile, ' '); assert.throws(() => assertSealed6(run));
  checks.push('Changed sealed candidate rejected');
  const {input, context} = inputs6('CoCoME_manageStore_queryStore');
  const contract = {definition: 's: Store = Store.allInstances()->any(x: Store | x.Id = id)', precondition: 's.oclIsUndefined() = false', postcondition: 'result = s'};
  const valid = await evaluateStage5Public(input, context, {contract});
  assert(valid.evaluation?.preExecValid);
  const diag = diagnostics6(valid);
  assert(diag.business.every(row => row.assessment === 'not-assessed'));
  checks.push('Real common PreExec pass does not assert business obligations satisfied');
  const wrong = await evaluateStage5Public(input, context, {contract: {...contract, postcondition: 'result = true'}});
  assert.equal(wrong.evaluation?.modelTypeValid, false); checks.push('Real typed evaluator rejects Store versus Boolean conflict');
  const unresolved = diagnostics6(valid, [{category: 'CG-TARGET', verdict: 'unresolved', evidence: [{reason: 'No identity witness'}]}]);
  assert.equal(unresolved.business.find(row => row.id === 'CG-TARGET')!.unresolvedCountsAsSuccessOrFailure, false);
  checks.push('Unresolved business evidence is neither pass nor fail');
  assert.throws(() => diagnostics6(valid, [{category: 'CG-TARGET', verdict: 'witnessed-violation', evidence: []}]));
  checks.push('Business verdict requires nonempty external evidence');
  const evidence = structuralEvidence6({contract: {...contract, postcondition: 'result = true'}}, context);
  assert(evidence.modelDiagnostics?.length); checks.push('Original typed checker supplies detailed diagnostic evidence');
  save(`${out}/drift/identity.json`, {...identity, freezeDrift: [{file: 'docs/missing.md', status: 'missing'}]});
  assert.throws(() => verify6(`${out}/drift`)); checks.push('Unresolved historical freeze drift blocks live execution');
  save(`${out}/summary.json`, {passed: checks.length, checks, mockLogicalCalls: calls, realModelCalls: 0, paidCalls: 0,
    hiddenJestEvaluations: 0, mockTerminalEvaluations: terminal});
  console.log(JSON.stringify({passed: checks.length, mockLogicalCalls: calls, realModelCalls: 0, paidCalls: 0, hiddenJestEvaluations: 0}));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
