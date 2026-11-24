import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse as parseEnv} from 'dotenv';
import {buildPilot, executePilot, recoverOnly, read, save, hash, adapterSourceFiles} from './lib/m4LiveAdapter';
import {createOCLGenerationConfiguration, createModelReasoningKwargs} from '../src/app/service/generationConfiguration';

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(['--frozen-dir', '--output-dir', '--execute-paid', '--authorization', '--preview-dir', '--inspect-only']);
  for (let i = 0; i < args.length; i++) {
    assert.ok(allowed.has(args[i]), `Unknown option ${args[i]}`);
    if (!['--execute-paid', '--inspect-only'].includes(args[i])) {assert.ok(args[i + 1] && !args[i + 1].startsWith('--')); i++;}
  }
  const value = (key: string, fallback = '') => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
  const output = value('--output-dir', 'results/cross-clause-m41-preview-v1');
  if (args.includes('--inspect-only')) {assert.ok(!args.includes('--execute-paid')); console.log(JSON.stringify(recoverOnly(output), null, 2)); return;}
  const frozen = value('--frozen-dir', 'results/cross-clause-m4-pilot-v3');
  const pilot = buildPilot(frozen);
  const env = {...(fs.existsSync('.env') ? parseEnv(fs.readFileSync('.env')) : {}),
    ...(fs.existsSync('.env.local') ? parseEnv(fs.readFileSync('.env.local')) : {}), ...process.env};
  const apiKey = env.OPENAI_API_KEY || env.API_KEY, baseURL = env.OPENAI_BASE_URL;
  const endpoint = baseURL ? new URL(baseURL) : null;
  const endpointValid = Boolean(endpoint && ['http:', 'https:'].includes(endpoint.protocol) && !endpoint.username && !endpoint.password && !endpoint.search);
  const sourceHashes = Object.fromEntries(adapterSourceFiles.map(file => [file, hash(fs.readFileSync(file))]));
  const requestHashes = Object.fromEntries(Object.entries(pilot.requests).map(([arm, request]) => [arm, hash(JSON.stringify(request.trace))]));
  const identity = {frozenDirectory: path.resolve(frozen), sourceHashes, sharedHash: hash(JSON.stringify(pilot.shared)), requestHashes,
    model: pilot.shared.model, configuration: createOCLGenerationConfiguration(), reasoning: createModelReasoningKwargs(pilot.shared.model),
    sdkMaxRetries: 0, timeoutMs: 120000, initialReservedSlotsPerArm: 1, maxNewCallsPerArm: 2, maxNewCallsPair: 4,
    hiddenJestEnabled: false, providerInternalRetryVisibility: 'unknown', resultSchema: 'm41-paired-results-v1',
    configurationPresence: {keyPresent: Boolean(apiKey), endpointValid, endpointSha256: baseURL ? hash(baseURL) : null, networkProbed: false}};
  if (!args.includes('--execute-paid')) {
    assert.ok(!args.includes('--authorization'), 'Authorization without --execute-paid is not an execution request');
    assert.ok(!fs.existsSync(output), 'Preview already exists; use a new directory');
    fs.mkdirSync(output, {recursive: true});
    save(path.join(output, 'identity.json'), identity);
    for (const arm of ['ordinary', 'dependency-guided'] as const) {
      save(path.join(output, arm, 'request.json'), pilot.requests[arm].trace);
      save(path.join(output, arm, 'permission.json'), read(path.join(frozen, arm, 'permission.json')));
      save(path.join(output, arm, 'result-template.json'), {arm, attempt: null, status: null, stop: null, requestHash: null,
        previousCandidate: null, candidate: null, astDiff: null, protocolAccepted: null, permissionPassed: null, scope: null,
        preexec: null, crossClause: null, usage: null, elapsedMs: null, sdkRetries: 0, providerInternalRetries: 'unknown',
        mayHaveConsumedFees: null, introducedDiagnosticFamilies: null, reintroducedDiagnosticFamilies: null});
    }
    save(path.join(output, 'comparison.json'), {sameFirstThreeMessages: true, sameInitialCandidate: true, sameBudget: true,
      independentOutputDirectories: true, permissionMechanisms: {ordinary: 'existing M2 directed + clause scope audit',
        'dependency-guided': 'existing M3 D-source permission + protected AST audit'}, preexec: 'validateDependencyRepairPreExec',
      sameResultStructure: true, sharedInitialCandidateHash: hash(JSON.stringify(pilot.shared.candidate)),
      planHash: pilot.params.plan.hash, packageHash: pilot.pack.hash, requestHashes,
      realModelCalls: 0, paidCalls: 0, hiddenJestEvaluations: 0});
    save(path.join(output, 'authorization-template.json'), {approved: false, acknowledgement: 'AUTHORIZE_ONE_M4_PAIR_MAX_FOUR_NEW_CALLS',
      identitySha256: hash(JSON.stringify(identity)), outputDirectory: 'REPLACE_WITH_ABSOLUTE_NEW_EXECUTION_DIRECTORY', expiresAt: 'REPLACE_WITH_ISO_EXPIRY'});
    console.log(JSON.stringify({dryRun: true, output, identitySha256: hash(JSON.stringify(identity)), realModelCalls: 0, paidCalls: 0, hiddenJestEvaluations: 0}, null, 2));
    return;
  }
  const authorizationFile = value('--authorization'), preview = value('--preview-dir');
  assert.ok(authorizationFile && preview, 'Paid execution requires explicit authorization file AND frozen preview');
  const authorization = read(authorizationFile);
  assert.equal(authorization.approved, true, 'Paid execution not authorized');
  assert.equal(authorization.acknowledgement, 'AUTHORIZE_ONE_M4_PAIR_MAX_FOUR_NEW_CALLS');
  assert.equal(authorization.identitySha256, hash(JSON.stringify(identity)), 'Authorization not bound to current source/request/configuration');
  assert.deepEqual(read(path.join(preview, 'identity.json')), identity);
  for (const arm of ['ordinary', 'dependency-guided'] as const) assert.deepEqual(read(path.join(preview, arm, 'request.json')), pilot.requests[arm].trace);
  assert.equal(authorization.outputDirectory, path.resolve(output), 'Authorization output mismatch');
  assert.ok(Date.parse(authorization.expiresAt) > Date.now(), 'Authorization expired');
  assert.ok(!fs.existsSync(output), 'Execution directory already exists; do not retry an unknown invocation');
  assert.ok(apiKey && baseURL, 'Missing key or URL; no availability probe is sent');
  assert.ok(endpointValid, 'Invalid endpoint');
  // Provider construction is deliberately after every paid authorization check.
  const {ChatOpenAI} = await import('@langchain/openai');
  const {SystemMessage, HumanMessage} = await import('@langchain/core/messages');
  const config = identity.configuration;
  const model = new ChatOpenAI({model: identity.model, apiKey, temperature: config.temperature,
    maxTokens: config.maxTokens, maxRetries: 0, timeout: identity.timeoutMs,
    modelKwargs: identity.reasoning, configuration: {baseURL, maxRetries: 0}});
  const result = await executePilot(pilot, output, async trace => {
    const messages = trace.messages.map(message => message.type === 'system' ? new SystemMessage({content: message.content}) : new HumanMessage({content: message.content}));
    const response = await model.invoke(messages, {response_format: {type: 'json_object'}});
    return {content: response.content, usage_metadata: response.usage_metadata, response_metadata: response.response_metadata, id: response.id,
      serializedSDKMessage: response.toJSON()};
  }, {mock: false, executionMetadata: {identity, authorization: {approved: true, identitySha256: authorization.identitySha256,
    outputDirectory: authorization.outputDirectory, expiresAt: authorization.expiresAt}}});
  save(path.join(output, 'authorization-used.json'), {identitySha256: authorization.identitySha256, expiresAt: authorization.expiresAt});
  console.log(JSON.stringify(result, null, 2));
}
main().catch(error => {console.error(error instanceof Error ? error.message : 'Adapter failed'); process.exitCode = 1;});
