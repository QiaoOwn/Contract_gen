import {IterableReadableStream} from '@langchain/core/utils/stream';
import {loadNarrativeOperation} from './narrativeOperationInput';
import {prepareNarrativeInputV4, assertNarrativeInputV4} from './narrativeInputV4';
import {narrativeMessageRequest, decodeNarrativeCandidate} from './narrativeTransport';
import {budgetNarrativeTransport, createNarrativePaidTransport, type NarrativeTransport} from './narrativeCallBudget';
import {ccHash} from './crossClauseGraph';
import type {ProjectParam} from '../type';
import {validateUnifiedContract} from './unifiedContractValidation';
import {auditTaskEvidence} from './constraintTaskPlan';
import {evaluateContract} from './evaluateContract';
import {repairNarrativeCandidate, mapNarrativeEvidence, narrativeRepairContext} from './narrativeM3Adapter';
import {loadStructuredUnifiedOperation} from './structuredOperationInput';
import {prepareStructuredUnifiedInput, assertStructuredUnifiedInput} from './structuredUnifiedInput';
import {planDependencyRepair} from './dependencyRepairPermissions';

export type NarrativeRuntimeParam = ProjectParam & {operation: string; userInput?: string; narrativeRequirement?: string;
  generationMode?: 'narrative-v4' | 'structured-unified' | 'legacy-structured';
  model: string; apiKey?: string; prepareOnly?: boolean; maxGenerationAttempts?: number;
  narrativeIdentity?: {operationId?: string; datasetVersion?: string; signature?: unknown; typedModel?: Parameters<typeof loadNarrativeOperation>[0]['typedModel']};
  narrativeRepair?: boolean; narrativeRepairOption?: string; behaviorEvaluation?: boolean};
export type NarrativeRuntimeDrivers = {transport?: NarrativeTransport};
export function prepareNarrativeRuntime(param: NarrativeRuntimeParam) {
  if (typeof param.model !== 'string' || !param.model.trim()) throw new Error('Narrative model ID required');
  for (const flag of [param.prepareOnly, param.narrativeRepair, param.behaviorEvaluation])
    if (flag !== undefined && typeof flag !== 'boolean') throw new Error('Narrative execution flags must be Boolean');
  const claim = param.narrativeIdentity;
  const structured = param.generationMode === 'structured-unified';
  if (param.generationMode === 'legacy-structured') throw new Error('Legacy must use its independent runtime');
  if (structured && param.narrativeRepair) throw new Error('Structured input ablation is first-generation only; M3 is not enabled for this study');
  const loaded = structured ? loadStructuredUnifiedOperation({project: param.project, useCase: param.useCase, operation: param.operation,
    operationId: claim?.operationId, datasetVersion: claim?.datasetVersion, signature: claim?.signature, typedModel: claim?.typedModel,
    requirement: param.narrativeRequirement ?? param.userInput}) : loadNarrativeOperation({project: param.project, useCase: param.useCase, operation: param.operation,
    operationId: claim?.operationId, datasetVersion: claim?.datasetVersion, signature: claim?.signature, typedModel: claim?.typedModel,
    narrativeRequirement: param.narrativeRequirement ?? param.userInput});
  const prepared = structured ? prepareStructuredUnifiedInput(loaded.input, loaded.context, {modelSelection: false}) :
    prepareNarrativeInputV4(loaded.input, loaded.context, {modelSelection: false});
  if (!prepared.enabled) throw new Error('Narrative V4 unavailable');
  const maximum = param.maxGenerationAttempts ?? 5;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 5) throw new Error('Narrative maximum must be 1..5');
  const identity = ccHash({version: 'narrative-unified-v1', model: param.model, maximum, preparationHash: prepared.preparationHash,
    ...(structured ? {sourceFormat: 'Structured-v4'} : {}),
    repair: Boolean(param.narrativeRepair), repairOption: param.narrativeRepairOption ?? null, behavior: param.behaviorEvaluation !== false});
  return {loaded, prepared, maximum, identity, structured};
}
export async function* runNarrativePipeline(param: NarrativeRuntimeParam, drivers: NarrativeRuntimeDrivers = {}): AsyncGenerator<Record<string, any>> {
  const {loaded, prepared, maximum, identity, structured} = prepareNarrativeRuntime(param);
  yield {'Narrative Compilation': {version: 'narrative-unified-v1', identity, source: loaded.input, signature: loaded.signature,
    modelHash: prepared.fullModelHash, planHash: prepared.Tn.planHash, tasks: prepared.Tn.tasks.length,
    unresolved: prepared.Tn.unresolved, generationRelations: prepared.R.generation.length}};
  if (param.prepareOnly !== false && !drivers.transport) {
    yield {'Narrative Prepared': {messages: narrativeMessageRequest(prepared.messages), modelCalls: 0, paidAuthorized: false}};
    return;
  }
  const transport = drivers.transport ?? await createNarrativePaidTransport(identity, param.model, maximum, param.apiKey ?? '');
  const budget = budgetNarrativeTransport(transport, maximum);
  const request = narrativeMessageRequest(prepared.messages);
  const response = await budget.transport(request);
  if (structured) assertStructuredUnifiedInput(loaded.input, loaded.context, prepared, {modelSelection: false});
  else assertNarrativeInputV4(loaded.input, loaded.context, prepared, {modelSelection: false});
  let candidate = decodeNarrativeCandidate(response.value, 'narrative-internal-v1', {requirementVersion: structured ? 'Structured-v4' : 'Narrative-V3',
    sourceHash: loaded.input.sourceHash, modelHash: prepared.fullModelHash, planHash: prepared.Tn.planHash});
  yield {'OCL Generator': {ocl: candidate.contract, candidate, usage: response.usage ?? null, generationCount: budget.calls}};
  let taskAudit = auditTaskEvidence(prepared.compatibility.projection,
    {...candidate.contract, definition: candidate.contract.definition ?? ''}, mapNarrativeEvidence(prepared, candidate)!, loaded.context);
  let validation = await validateUnifiedContract(candidate, loaded.context, prepared.compatibility.projection);
  yield {'Narrative Validation': {validation, internalTaskAudit: taskAudit, privateEvidenceIsBusinessProof: false}};
  if (param.narrativeRepair && (!validation.preExecValid || taskAudit.issues.length || validation.deterministicConflicts.length)) {
    const repair = await repairNarrativeCandidate(loaded.input, loaded.context, candidate, {transport: budget.transport,
      maximum, consumed: budget.calls, model: param.model, optionId: param.narrativeRepairOption, initialValidatorDiagnostics: validation.diagnostics});
    candidate = repair.candidate;
    yield {'Narrative M3 Repair': repair};
    validation = await validateUnifiedContract(candidate, loaded.context, prepared.compatibility.projection);
    taskAudit = auditTaskEvidence(prepared.compatibility.projection, {...candidate.contract, definition: candidate.contract.definition ?? ''},
      mapNarrativeEvidence(prepared, candidate)!, loaded.context);
  }
  const permission = structured ? planDependencyRepair({plan: prepared.compatibility.projection, context: loaded.context, pack: prepared.K.original.original,
    candidate: {...candidate.contract, definition: candidate.contract.definition ?? ''}, taskEvidence: mapNarrativeEvidence(prepared, candidate)}) :
    narrativeRepairContext(loaded.input, loaded.context, candidate).permission;
  yield {'Narrative Repair Permission': {permission,
    enabled: Boolean(param.narrativeRepair), behaviorFeedback: false}};
  const behavior = validation.preExecValid && param.behaviorEvaluation !== false ? await evaluateContract({project: param.project,
    useCase: String(param.useCase), operation: param.operation, contract: validation.contract, ocl: candidate.contract,
    generatedSubsetValidation: true, oracleProfile: 'rm2pt-authoritative-preparation-v4'}) : null;
  yield {'Test Result': {contract: validation.contract, candidate, validation, behavior,
    typescript: validation.typescript ? {entity: validation.typescript.originalEntity, service: validation.typescript.originalService} : null,
    result: {success: behavior?.test_execution_ok ?? false, status: behavior ? behavior.test_execution_ok ? 'passed' : 'failed' : 'not-evaluated',
      message: behavior?.test_execution_error ?? '', testResults: []},
    summary: null, preExecAccepted: validation.preExecValid && !taskAudit.issues.length && !validation.deterministicConflicts.length,
    methodAccepted: validation.preExecValid && !taskAudit.issues.length && !validation.deterministicConflicts.length && behavior?.test_execution_ok === true,
    businessStatus: behavior ? 'finite-oracle-observation' : 'not-evaluated', formalExperimentReady: false, generationCount: budget.calls}};
}
export const generateNarrativeOCL = (param: NarrativeRuntimeParam) => IterableReadableStream.fromAsyncGenerator(runNarrativePipeline(param));
