import {z} from 'zod';
import {createG4Prompt} from '../../src/app/service/createG4Prompt';
import {createDefinitionPrompt} from '../../src/app/service/createDefinitionPrompt';
import {createGenerationRulesPrompt} from '../../src/app/service/createGenerationRulesPrompt';
import {taskSolutionSchema} from '../../src/app/service/constraintSolving';
import {CONSTRAINT_SYNTAX_GUIDANCE} from '../../src/app/service/constraintRepair';
import {narrativeExtractionSchema, type NarrativeInput} from '../../src/app/service/narrativeObligationCompiler';
import {prepareNarrativeObligationGuidedInput} from '../../src/app/service/narrativeJointGeneration';
import {reviewNarrativeRelations} from '../../src/app/service/narrativeRelationReview';
import type {OperationModelGrounding} from '../../src/app/service/operationModelGrounding';
import {ccHash} from '../../src/app/service/crossClauseGraph';
import {permissionAst} from '../../src/app/service/dependencyRepairAst';
import {parse} from '../../src/app/util';
import {validateGeneratedContractSemantics} from '../../src/app/service/validateGeneratedContractSemantics';
import {validateModelGroundedContract} from '../../src/app/service/validateModelGroundedContract';
import {auditCrossClauseContract} from '../../src/app/service/crossClauseConstraintAudit';
import {createEntryCode} from '../../src/app/service/createEntryCode';
import {parseTypescriptEntry} from '../../src/app/service/parseTypescriptEntry';

export const publicContractSchema = z.object({contract: taskSolutionSchema.shape.contract}).strict();
export type Arm3 = 'A' | 'B' | 'C' | 'D' | 'E';
export const jointBase3 = () => [createG4Prompt(), createDefinitionPrompt(), createGenerationRulesPrompt(), CONSTRAINT_SYNTAX_GUIDANCE].join('\n\n');
export function prepareArm3(input: NarrativeInput, context: OperationModelGrounding, arm: Arm3) {
  const prepared = prepareNarrativeObligationGuidedInput(input, context, 'E', {modelSelection: false});
  const common = {operationId: input.operationId, narrative: input.narrativeRequirement, sourceHash: input.sourceHash,
    signature: prepared.sections.OperationSignature, model: prepared.sections.ModelContext};
  const reviewed = reviewNarrativeRelations(prepared.R);
  const system = jointBase3() + '\nSolve one complete Definition/Precondition/Postcondition contract jointly. Definition may be null. Use only source requirements and supplied model. Return JSON {contract:{definition,precondition,postcondition}}; no planHash, taskId or taskEvidence is required by the public evaluation protocol.';
  if (arm === 'A' || arm === 'B') return {arm, common, commonHash: ccHash(common), prepared, reviewed,
    messages: [{role: 'system', content: arm === 'A' ? system : 'Extract behavioral obligation candidates from only the narrative and public model. Preserve exact end-exclusive source spans; retain ambiguous classifications. Return {sourceHash,obligations:[{taskId,category,obligationText,sourceSpans:[{start,end,exactText}],referencedRoles,referencedParameters,extractionStatus,provenance,rationale}]}. No OCL and no invented requirements. taskId starts with operationId + /narrative-task/. category: precondition/postcondition/unresolved; extractionStatus: explicit/inferred-candidate/ambiguous.'},
      {role: 'user', content: JSON.stringify({...common, ...(arm === 'B' ? {allowedNames: {parameters: input.parameters, modelTypes: input.modelTypes}} : {})})}],
    secondCallTemplate: arm === 'B' ? {system, common, decomposition: '<B first actual validated response only>'} : null};
  const body = {common, Tn: prepared.Tn, ...(arm !== 'C' ? {R: reviewed.retained, unresolvedRelations: reviewed.unresolved.map(relation => ({id: relation.id, reason: relation.reason}))} : {}),
    ...(arm === 'E' ? {K: {...prepared.compatibility.K.input, operationSpecific: {...prepared.compatibility.K.input.operationSpecific,
      relationRefs: reviewed.retained.map(relation => relation.id)}}} : {}),
    internalProtocol: {version: 'narrative-task-solution-v1', planHash: prepared.Tn.planHash,
      taskIds: prepared.Tn.tasks.filter(task => task.category !== 'unresolved').map(task => task.taskId),
      meaning: 'Method-internal task evidence is scored separately from common contract correctness; unresolved meanings remain visible.'}};
  return {arm, common, commonHash: ccHash(common), prepared, reviewed,
    messages: [{role: 'system', content: system + '\nFor this method also return the supplied planHash and taskEvidence [{taskId,expression}] under the unchanged taskSolutionSchema. These internal fields are not part of the common behavioral correctness metric.'},
      {role: 'user', content: JSON.stringify(body)}], secondCallTemplate: null};
}

export function completeDecomposition3(input: NarrativeInput, request: ReturnType<typeof prepareArm3>, raw: unknown) {
  if (request.arm !== 'B' || !request.secondCallTemplate) throw new Error('Not decomposition arm');
  const proposal = narrativeExtractionSchema.parse(raw);
  if (proposal.sourceHash !== input.sourceHash) throw new Error('B source mismatch');
  const seen = new Set<string>();
  for (const task of proposal.obligations) {
    if (seen.has(task.taskId) || !task.taskId.startsWith(`${input.operationId}/narrative-task/`)) throw new Error('B task identity invalid');
    seen.add(task.taskId);
    for (const span of [...task.sourceSpans, ...(task.contextSpans ?? [])])
      if (span.start < 0 || span.end > input.narrativeRequirement.length || span.end <= span.start || input.narrativeRequirement.slice(span.start, span.end) !== span.exactText) throw new Error('B span invalid');
    if (task.obligationText !== task.sourceSpans.map(span => span.exactText).join(' ') ||
      task.referencedRoles.some(role => !input.modelTypes.includes(role)) || task.referencedParameters.some(name => !input.parameters.includes(name))) throw new Error('B unsupported content');
  }
  return [{role: 'system', content: request.secondCallTemplate.system}, {role: 'user', content: JSON.stringify({
    ...request.common, modelDecomposition: proposal, decompositionOrigin: 'B-own-first-response'})}];
}

export async function evaluateCommon3(raw: unknown, request: ReturnType<typeof prepareArm3>) {
  const object = raw && typeof raw === 'object' && 'contract' in raw ? raw as {contract: unknown} : null;
  const decoded = object ? publicContractSchema.safeParse({contract: object.contract}) : publicContractSchema.safeParse(raw);
  const internalProtocolValid = request.arm === 'A' || request.arm === 'B' ? publicContractSchema.safeParse(raw).success :
    taskSolutionSchema.safeParse(raw).success && (raw as {planHash?: string}).planHash === request.prepared.Tn.planHash;
  if (!decoded.success) return {publicContractValid: false, internalProtocolValid, syntaxValid: false, preExecValid: false, behavior: 'not-evaluated'};
  const candidate = {...decoded.data.contract, definition: decoded.data.contract.definition ?? ''};
  const context = request.prepared.fullAuthority;
  const tree = parse(permissionAst(candidate, context).contract);
  const syntaxValid = !!tree.tree && tree.errors.length === 0;
  const subset = syntaxValid ? validateGeneratedContractSemantics({tree: tree.tree!, hasReturnValue: !!context.index.operation.returnType}) : null;
  const model = syntaxValid ? validateModelGroundedContract({tree: tree.tree!, context}) : null;
  const cross = auditCrossClauseContract({enabled: true, context, plan: request.prepared.compatibility.projectionPlan, candidate});
  let preExecValid = false;
  let lowering: unknown = null;
  if (syntaxValid && subset?.length === 0 && model?.diagnostics.length === 0) {
    try {
      const code = await createEntryCode({project: context.index.project, useCase: context.index.useCase, operation: context.index.operation.name, ocl: candidate} as never);
      lowering = parseTypescriptEntry(code.entry); preExecValid = (lowering as unknown[]).length === 0;
    } catch (error) {lowering = String(error);}
  }
  return {publicContractValid: true, internalProtocolValid, syntaxValid, subsetValid: subset?.length === 0,
    modelTypeValid: model?.diagnostics.length === 0, preExecValid, lowering,
    deterministicConflicts: cross.diagnostics.filter(diagnostic => diagnostic.status === 'conflict'),
    unresolved: cross.diagnostics.filter(diagnostic => diagnostic.status === 'unresolved'), behavior: 'not-evaluated'};
}
