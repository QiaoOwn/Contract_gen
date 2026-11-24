import fs from 'node:fs';
import path from 'node:path';
import {ccHash} from './crossClauseGraph';
import {restoreNarrativeMessages, type NarrativeMessageRequest} from './narrativeTransport';
import type {OclGenerationUsage} from './generateOclWithJsonMode';

export type NarrativeTransport = (request: NarrativeMessageRequest) => Promise<{value: unknown; usage?: OclGenerationUsage; raw?: unknown}>;
export function persistNarrative(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const fd = fs.openSync(file, 'wx');
  try {fs.writeFileSync(fd, JSON.stringify(value, null, 2)); fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
}
export function budgetNarrativeTransport(transport: NarrativeTransport, maximum: number) {
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 5) throw new Error('Narrative call budget must be 1..5');
  let calls = 0, pending = false, stopped = false;
  return {get calls() {return calls;}, transport: async (request: NarrativeMessageRequest) => {
    if (stopped || pending || calls >= maximum) throw new Error('Narrative budget exhausted or response unknown');
    restoreNarrativeMessages(request);
    calls++; pending = true;
    try {const value = await transport(structuredClone(request)); pending = false; return value;}
    catch (error) {stopped = true; throw error;}
  }};
}
export async function createNarrativePaidTransport(identity: string, model: string, maximum: number, apiKey: string): Promise<NarrativeTransport> {
  if (process.env.CONTRACTGEN_NARRATIVE_PAID_ENABLED !== 'true') throw new Error('Narrative paid execution is disabled');
  const authorizationPath = 'config/narrative-live-authorization.json';
  if (!fs.existsSync(authorizationPath)) throw new Error('Explicit Narrative authorization file required');
  const auth = JSON.parse(fs.readFileSync(authorizationPath, 'utf8'));
  const endpoint = process.env.OPENAI_BASE_URL;
  if (!endpoint || !apiKey) throw new Error('Missing Narrative provider configuration');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid Narrative endpoint');
  if (auth.approved !== true || auth.scope !== 'narrative-unified-v1' || auth.identity !== identity || auth.model !== model ||
      auth.maxCalls !== maximum || auth.endpointHash !== ccHash(endpoint) || !(Date.parse(auth.expiresAt) > Date.now()) ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(auth.runId)) throw new Error('Narrative authorization identity/budget mismatch');
  const {verifyNarrativeBaseline} = await import('./narrativeBaseline');
  const baseline = verifyNarrativeBaseline();
  if (auth.baselineHash !== ccHash(baseline)) throw new Error('Narrative authorization must bind the current release baseline');
  const root = `results/narrative-unified-runs/${auth.runId}`;
  fs.mkdirSync(path.dirname(root), {recursive: true});
  fs.mkdirSync(root); // A prior/unknown run cannot be replayed.
  persistNarrative(`${root}/run.json`, {identity, model, maximum, endpointHash: auth.endpointHash, retries: 0});
  const {ChatOpenAI} = await import('@langchain/openai');
  const {createOCLGenerationConfiguration, createModelReasoningKwargs} = await import('./generationConfiguration');
  const config = createOCLGenerationConfiguration();
  const client = new ChatOpenAI({model, apiKey, temperature: config.temperature, maxTokens: config.maxTokens,
    modelKwargs: createModelReasoningKwargs(model), maxRetries: 0, timeout: 120000, configuration: {baseURL: endpoint, maxRetries: 0}});
  let calls = 0, unknown = false;
  return async request => {
    if (unknown || calls >= maximum) throw new Error('Paid Narrative run stopped/exhausted');
    const slot = `${root}/call-${++calls}`;
    const messages = restoreNarrativeMessages(request);
    persistNarrative(`${slot}/request.json`, request);
    persistNarrative(`${slot}/reservation.json`, {identity, call: calls, requestHash: request.messagesHash, refundable: false});
    const started = performance.now();
    let response;
    try {
      response = await client.invoke(messages, {response_format: {type: 'json_object'}});
      persistNarrative(`${slot}/raw-response.json`, {content: response.content, usage: response.usage_metadata,
        metadata: response.response_metadata, id: response.id, serialized: response.toJSON()});
    } catch {
      unknown = true;
      persistNarrative(`${slot}/outcome.json`, {status: 'unknown', retries: 0, mayHaveConsumedFees: true});
      throw new Error('Narrative provider status unknown; inspect persisted reservation, do not retry');
    }
    try {
      if (response.response_metadata.finish_reason !== 'stop' || typeof response.content !== 'string') throw new Error('Incomplete Narrative response');
      const value = JSON.parse(response.content);
      const u = response.usage_metadata;
      const usage = {inputTokens: u?.input_tokens ?? null, outputTokens: u?.output_tokens ?? null,
        totalTokens: u?.total_tokens ?? null, reasoningTokens: null, finishReason: 'stop'};
      persistNarrative(`${slot}/outcome.json`, {status: 'received', usage, latencyMs: performance.now() - started});
      return {value, usage};
    } catch (error) {
      unknown = true;
      persistNarrative(`${slot}/outcome.json`, {status: 'protocol-invalid', latencyMs: performance.now() - started});
      throw error;
    }
  };
}
