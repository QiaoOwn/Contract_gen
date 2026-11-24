import {createHash} from 'node:crypto';
import {ccHash} from './crossClauseGraph';
import {prepareNarrativeInputV4, assertNarrativeInputV4} from './narrativeInputV4';
import {createNarrativeGenerationIdentity} from './narrativeRequestIdentity';
import {runDependencyRepair} from './dependencyRepairLoop';
import {planDependencyRepair} from './dependencyRepairPermissions';
import {taskSolutionSchema} from './constraintSolving';
import type {RepairDiagnostic} from './repairDiagnostics';
import {narrativeMessageRequest, type UnifiedContractCandidate} from './narrativeTransport';
import type {NarrativeTransport} from './narrativeCallBudget';
import type {NarrativeInput} from './narrativeObligationCompiler';
import type {OperationModelGrounding} from './operationModelGrounding';

export function mapNarrativeEvidence(prepared: ReturnType<typeof prepareNarrativeInputV4>, candidate: UnifiedContractCandidate) {
  if (!prepared.enabled || candidate.provenance.planHash !== prepared.Tn.planHash || candidate.provenance.modelHash !== prepared.fullModelHash ||
    candidate.provenance.sourceHash !== prepared.input.sourceHash ||
    candidate.provenance.requirementVersion !== ('sourceAdapter' in prepared.Tn ? 'Structured-v4' : 'Narrative-V3'))
    throw new Error('M3 candidate provenance mismatch');
  if (candidate.internalEvidence === null) return undefined; // Public candidates do not receive invented task evidence.
  return candidate.internalEvidence.map(item => {
    const mapping = prepared.compatibility.mapping.find(mapping => mapping.taskId === item.taskId);
    if (!mapping) throw new Error('Unknown/unresolved Narrative evidence task');
    return {...item, taskId: mapping.projectionId};
  });
}
export function narrativeRepairContext(source: NarrativeInput, context: OperationModelGrounding, candidate: UnifiedContractCandidate) {
  const prepared = prepareNarrativeInputV4(source, context, {modelSelection: false});
  if (!prepared.enabled) throw new Error('Narrative V4 disabled');
  const evidence = mapNarrativeEvidence(prepared, candidate);
  const contract = {...candidate.contract, definition: candidate.contract.definition ?? ''};
  const pack = prepared.K.original.original;
  const permissionInput = {plan: prepared.compatibility.projection, context, candidate: contract, pack, taskEvidence: evidence};
  return {prepared, evidence, contract, pack, permission: planDependencyRepair(permissionInput), permissionInput};
}

/** ID conversion is confined to the M3 boundary; source Tn and the model-facing protocol stay native. */
export async function repairNarrativeCandidate(source: NarrativeInput, context: OperationModelGrounding, candidate: UnifiedContractCandidate,
  options: {transport: NarrativeTransport; maximum: number; consumed: number; model: string; optionId?: string;
    previousCandidate?: Parameters<typeof runDependencyRepair>[0]['previousCandidate']; initialValidatorDiagnostics?: RepairDiagnostic[]}) {
  const scope = narrativeRepairContext(source, context, candidate), p = scope.prepared;
  const identity = createNarrativeGenerationIdentity(source, context);
  const input = JSON.stringify(p.sections);
  const toNative = new Map<string, string>([[scope.permissionInput.plan.hash, p.Tn.planHash],
    ...p.compatibility.mapping.map(mapping => [mapping.projectionId, mapping.taskId] as [string, string])]);
  const inputIdentity = ccHash({source, context, candidate});
  const nativeProtocolFailures: {reason: string; response: unknown}[] = [];
  const result = await runDependencyRepair({plan: scope.permissionInput.plan, context, input,
    requirement: source.narrativeRequirement, inputHash: createHash('sha256').update(input).digest('hex'), narrativeIdentity: identity,
    model: options.model as never, apiKey: 'unused-controlled-transport', baseURL: 'https://unused.invalid', diagnostics: [],
    initialCandidate: scope.contract, initialEvidence: scope.evidence, maxAttempts: options.maximum,
    consumedAttempts: options.consumed, optionId: options.optionId, previousCandidate: options.previousCandidate,
    initialValidatorDiagnostics: options.initialValidatorDiagnostics}, scope.pack, {
    transport: async request => {
      assertNarrativeInputV4(source, context, p, {modelSelection: false});
      const dto = narrativeMessageRequest(request.messages);
      dto.messages = dto.messages.map(message => ({...message, content: [...toNative].reduce((text, [projection, native]) =>
        text.replaceAll(JSON.stringify(projection), JSON.stringify(native)), message.content)}));
      dto.messagesHash = ccHash(dto.messages);
      const response = await options.transport(dto);
      const decoded = taskSolutionSchema.safeParse(response.value);
      if (!decoded.success || decoded.data.planHash !== p.Tn.planHash || decoded.data.taskEvidence.some(item =>
        !p.compatibility.mapping.some(mapping => mapping.taskId === item.taskId))) {
        nativeProtocolFailures.push({reason: 'Foreign/malformed Narrative task-solution identity', response: response.value});
        return {value: {invalidNarrativeProtocol: true}, usage: response.usage ?? {
          inputTokens: null, outputTokens: null, totalTokens: null, reasoningTokens: null, finishReason: null}};
      }
      const parsed = decoded.data;
      const taskEvidence = parsed.taskEvidence.map(item => {
        const mapping = p.compatibility.mapping.find(mapping => mapping.taskId === item.taskId);
        if (!mapping) throw new Error('M3 returned unknown Narrative task');
        return {...item, taskId: mapping.projectionId};
      });
      return {value: {...parsed, planHash: scope.permissionInput.plan.hash, taskEvidence}, usage: response.usage ?? {
        inputTokens: null, outputTokens: null, totalTokens: null, reasoningTokens: null, finishReason: null}};
    },
  });
  if (ccHash({source, context, candidate}) !== inputIdentity) throw new Error('M3 changed Narrative authority');
  const finalEvent = result.events.at(-1) as {proposal?: unknown} | undefined;
  const decoded = taskSolutionSchema.safeParse(finalEvent?.proposal);
  const acceptedFinal = decoded.success && ccHash({...decoded.data.contract, definition: decoded.data.contract.definition ?? ''}) === ccHash(result.candidate);
  const internalEvidence = acceptedFinal && decoded.success ? decoded.data.taskEvidence.map(item => {
    const mapping = p.compatibility.mapping.find(mapping => mapping.projectionId === item.taskId);
    if (!mapping) throw new Error('M3 projection evidence not in source mapping');
    return {...item, taskId: mapping.taskId};
  }) : candidate.internalEvidence;
  return {result, nativeProtocolFailures, initialPermission: scope.permission, narrativePlanHash: p.Tn.planHash, projectionPlanHash: scope.permissionInput.plan.hash,
    candidate: {...candidate, contract: result.candidate, internalEvidence}, semanticScope: 'Original M3 permissions; Narrative identity and evidence mapping only'};
}
