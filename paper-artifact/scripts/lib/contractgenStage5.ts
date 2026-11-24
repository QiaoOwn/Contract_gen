import {ccHash} from '../../src/app/service/crossClauseGraph';
import type {NarrativeInput} from '../../src/app/service/narrativeObligationCompiler';
import {narrativeExtractionSchema} from '../../src/app/service/narrativeObligationCompiler';
import {prepareNarrativeInputV4} from '../../src/app/service/narrativeInputV4';
import type {OperationModelGrounding} from '../../src/app/service/operationModelGrounding';
import {publicContractSchema, jointBase3, completeDecomposition3, prepareArm3, evaluateCommon3} from './narrativeStage3';
import {decodeNarrativeCandidate} from '../../src/app/service/narrativeTransport';
import {validateUnifiedContract} from '../../src/app/service/unifiedContractValidation';
import {getOcltsvmLanguageSpecification} from '../../src/app/service/ocltsvmLanguageSpecification';

export type Stage5Arm = 'A' | 'B' | 'C' | 'D' | 'E';
export const stage5PublicSchema = publicContractSchema;
const extractionSchema = narrativeExtractionSchema;
export const stage5JointSystem = () => jointBase3() + '\nSolve one complete Definition/Precondition/Postcondition contract jointly from the same original narrative and authoritative model. Definition may be null. Return exactly JSON {contract:{definition,precondition,postcondition}}. Do not return planHash, taskEvidence or taskId fields. Program-derived annotations, when present, are candidate interpretations; unresolved text stays visible. Business relation hints are advisory, not proofs. Do not invent missing business facts.';

export function prepareStage5Arm(input: NarrativeInput, context: OperationModelGrounding, arm: Stage5Arm) {
  if (!['A', 'B', 'C', 'D', 'E'].includes(arm)) throw new Error('Unknown study arm');
  const prepared = prepareNarrativeInputV4(input, context, {modelSelection: false});
  if (!prepared.enabled) throw new Error('Frozen compiler disabled');
  const common = {operationId: input.operationId, NarrativeRequirement: {text: input.narrativeRequirement, sourceHash: input.sourceHash},
    OperationSignature: prepared.sections.OperationSignature, ModelContext: prepared.sections.ModelContext,
    TargetLanguage:getOcltsvmLanguageSpecification()};
  const generatedRoleIds = new Set(prepared.R.generation.flatMap(relation => relation.roleEvidence));
  const relationPackage = {version: 'stage5-generation-r-view-v1', relations: prepared.R.generation,
    roleDefinitions: prepared.RoleMapping.roles.filter(role => generatedRoleIds.has(role.id)),
    evidenceConvention: 'Role IDs are source-derived textual candidates, not OCL variables or proved business identity.'};
  const publicK = {...prepared.sections.K,
    globalRules: prepared.sections.K.globalRules.filter(rule => rule.kind !== 'task-support'),
    protocolAdaptation: 'Only the internal taskEvidence output obligation is excluded from the shared public-contract experiment. Structural K conditions remain unchanged; original complete K stays in the audit.'};
  const body = {...common,
    ...(['C', 'D', 'E'].includes(arm) ? {Tn: prepared.sections.DerivedObligationPlan,
      SourceCoordinateConvention: prepared.sections.SourceCoordinateConvention} : {}),
    ...(['D', 'E'].includes(arm) ? {GenerationR: relationPackage} : {}),
    ...(arm === 'E' ? {K: publicK} : {}),
    OutputProtocol: {version: 'contractgen-stage5-public-contract-v1', fields: ['contract.definition', 'contract.precondition', 'contract.postcondition'],
      taskEvidenceRequired: false, planHashRequired: false}};
  const messages = [{role: 'system', content: stage5JointSystem()}, {role: 'user', content: JSON.stringify(body)}];
  const extractionRequest = arm === 'B' ? [
    {role: 'system', content: 'Decompose the given narrative into candidate behavioral requirements without OCL. Preserve exact source spans and ambiguity. Return JSON matching the supplied extraction schema. Do not invent business requirements. Your own decomposition will be provided to the joint generation step; no program-issued Tn/B/R/K is given.'},
    {role: 'user', content: JSON.stringify({...common,
      schema: 'narrativeExtractionSchema',
      requiredOutput: {sourceHash: input.sourceHash, obligations: [{taskId: '<operationId>/narrative-task/<own-id>', category: 'precondition|postcondition|unresolved',
        obligationText: '<sourceSpans exactText joined by spaces>', sourceSpans: [{start: '<zero-based UTF16>', end: '<exclusive>', exactText: '<original text>'}],
        referencedRoles: '<array of supplied model type names>', referencedParameters: '<array of supplied parameter names>',
        extractionStatus: 'explicit|inferred-candidate|ambiguous', provenance: '<nonempty string array>', rationale: '<string>'}]},
      allowedNames: {modelTypes: input.modelTypes, parameters: input.parameters}})},
  ] : null;
  return {arm, common, commonHash: ccHash(common), messages, extractionRequest,
    secondCallTemplate: arm === 'B' ? {common, system: stage5JointSystem(), decomposition: '<B own validated response, never program Tn>'} : null,
    prepared, body, requestHash: ccHash(messages), schemaVersion: 'contractgen-stage5-public-contract-v1', plannedCalls: arm === 'B' ? 2 : 1};
}

export function finalizeStage5B(input: NarrativeInput, context: OperationModelGrounding, request: ReturnType<typeof prepareStage5Arm>, response: unknown) {
  if (request.arm !== 'B') throw new Error('Own decomposition is only valid for arm B');
  extractionSchema.parse(response);
  // Reuse source/span/model validation; its legacy joint messages are discarded, not used to alter this experiment.
  completeDecomposition3(input, prepareArm3(input, context, 'B'), response);
  if (request.prepared.fullModelHash !== ccHash(context) || request.common.NarrativeRequirement.text !== input.narrativeRequirement)
    throw new Error('B request/model identity changed');
  return [{role: 'system', content: stage5JointSystem()}, {role: 'user', content: JSON.stringify({...request.common,
    OwnModelDecomposition: response, decompositionOrigin: 'B-own-actual-first-response', OutputProtocol: request.body.OutputProtocol})}];
}

export async function evaluateStage5Public(input: NarrativeInput, context: OperationModelGrounding, response: unknown) {
  const decoded = stage5PublicSchema.safeParse(response);
  if (!decoded.success) return {publicProtocolValid: false, protocolErrors: decoded.error.issues,
    evaluation: null, behavior: 'not-evaluated', businessErrorVerdicts: 'not-assessed'};
  // Same existing objective evaluator and same narrative/model for every arm; method identity is not an input.
  const reference = prepareNarrativeInputV4(input, context, {modelSelection: false});
  if (!reference.enabled) throw new Error('Narrative V4 disabled');
  const candidate = decodeNarrativeCandidate(decoded.data, 'public-contract-v1', {requirementVersion: 'Narrative-V3',
    sourceHash: input.sourceHash, modelHash: reference.fullModelHash, planHash: reference.Tn.planHash});
  const evaluation = await validateUnifiedContract(candidate, context, reference.compatibility.projection);
  return {publicProtocolValid: true, evaluation, behavior: 'not-evaluated', businessErrorVerdicts: 'not-assessed',
    meaning: 'Typed AST diagnoses structural conflicts; business categories require separate frozen terminal evidence.'};
}
