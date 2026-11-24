import {z} from 'zod';
import {SystemMessage, HumanMessage} from '@langchain/core/messages';
import {createConstraintSolvingSystemPrompt, taskSolutionSchema} from './constraintSolving';
import {compileNarrativeObligations, type NarrativeInput} from './narrativeObligationCompiler';
import {compileNarrativeCompatibility} from './narrativeCompatibility';
import {compileNarrativeRelations} from './narrativeRelations';
import {ccHash} from './crossClauseGraph';
import type {OperationModelGrounding} from './operationModelGrounding';
import {MODEL_RULE_FAMILIES, createModelGroundingRules} from './modelGroundingRules';
import {generationMessageTrace} from './generationMessageTrace';
import {auditTaskEvidence} from './constraintTaskPlan';
import {auditCollaborative25} from './crossClauseCollaborative25';
import {compilePackage25} from './crossClausePackage25';

const inputSchema = z.object({operationId: z.string().min(1), narrativeRequirement: z.string().min(1),
  sourceHash: z.string().min(1), parameters: z.array(z.string()), modelTypes: z.array(z.string()), modelHash: z.string().optional()}).strict();
export type NarrativeMode = 'C' | 'D' | 'E';
export const createNarrativeJointProtocol = (planHash: string, issuedTaskIds: string[], unresolvedTaskIds: string[]) => ({
  version: 'narrative-task-solution-v1', schema: 'unchanged taskSolutionSchema', planHash, issuedTaskIds, unresolvedTaskIds,
  policy: 'One complete D/P/Q joint solution per call. Definition is optional. Classifications are program-derived candidates, not user-labelled truths. Preserve branch context. Unresolved text remains visible and must not be silently converted into extra preconditions. No target OCL or variable names are provided.',
});
export const createNarrativeJointSystemPrompt = () => createConstraintSolvingSystemPrompt() + '\n\nNarrative protocol v1: use only narrative task IDs and the supplied Tn planHash. The classified tasks have candidate P/Q ownership. Unresolved fragments are not mandatory clause-specific evidence tasks; interpret them against the full original narrative and do not invent missing behavior. Full source context overrides an isolated fragment. Compatibility projection line numbers never denote original source lines.';

export function prepareNarrativeObligationGuidedInput(source: NarrativeInput, context: OperationModelGrounding, mode: NarrativeMode = 'E', options: {modelSelection?: boolean} = {}) {
  inputSchema.parse(source);
  if (!['C', 'D', 'E'].includes(mode)) throw new Error('Unknown narrative generation mode');
  if (ccHash(createModelGroundingRules(context.index)) !== ccHash(context.rules)) throw new Error('Model rules differ from authority');
  const modelHash = ccHash(context);
  if (source.modelHash && source.modelHash !== modelHash) throw new Error('Narrative authority hash mismatch');
  const input = {...source, modelHash};
  const tn = compileNarrativeObligations(input);
  const compatibility = compileNarrativeCompatibility(input, tn, context, options.modelSelection ?? true);
  const R = compileNarrativeRelations(input, tn, compatibility);
  const sections = {
    version: 'narrative-joint-input-v1', mode,
    NarrativeRequirement: {text: input.narrativeRequirement, sourceHash: input.sourceHash, sourceType: 'caller-provided-narrative'},
    OperationSignature: {service: context.index.operation.service, ...compatibility.K.audit.original.base.signature},
    DerivedObligationPlan: tn,
    ...(mode !== 'C' ? {CrossObligationRelations: R} : {}),
    // Identical model selection across C/D/E isolates relation/package inclusion.
    ModelContext: compatibility.selection.inputView,
    ModelRules: MODEL_RULE_FAMILIES,
    ...(mode === 'E' ? {K: compatibility.K.input} : {}),
    GenerationProtocol: createNarrativeJointProtocol(tn.planHash, tn.tasks.filter(task => task.category !== 'unresolved').map(task => task.taskId), tn.unresolved),
  };
  const messages = [new SystemMessage(createNarrativeJointSystemPrompt()),
    new HumanMessage(JSON.stringify(sections))];
  return {input, Tn: tn, R, compatibility, sections, messages, fullAuthority: structuredClone(context),
    trace: generationMessageTrace('dry-run-unselected-model', messages),
    requestHash: ccHash(messages.map(message => message.content)), modelHash, modelCalls: 0};
}

export async function runNarrativeJointGeneration(source: NarrativeInput, context: OperationModelGrounding,
  options: {mode?: NarrativeMode; transport?: (request: {messages: ReturnType<typeof prepareNarrativeObligationGuidedInput>['messages']}) => Promise<{value: unknown}>} = {}) {
  const prepared = prepareNarrativeObligationGuidedInput(source, context, options.mode ?? 'E');
  if (!options.transport) return {prepareOnly: true, prepared, logicalModelCalls: 0};
  const before = ccHash({source, context, prepared});
  const response = await options.transport({messages: structuredClone(prepared.messages)});
  if (ccHash({source, context, prepared}) !== before) throw new Error('Narrative immutable inputs altered by transport');
  const value = taskSolutionSchema.parse(response.value);
  if (value.planHash !== prepared.Tn.planHash) throw new Error('Wrong Narrative plan identity');
  const mappings = prepared.compatibility.mapping;
  const evidence = value.taskEvidence.map(item => {
    const map = mappings.find(map => map.narrativeTaskId === item.taskId);
    if (!map) throw new Error('Unknown or unresolved task evidence identity');
    return {...item, taskId: map.projectionTaskId};
  });
  const candidate = {...value.contract, definition: value.contract.definition ?? ''};
  const plan = prepared.compatibility.projectionPlan;
  const evidenceAudit = auditTaskEvidence(plan, candidate, evidence, context);
  const crossClause = auditCollaborative25({plan, context, candidate, taskEvidence: evidence}, compilePackage25(plan, context));
  return {prepareOnly: false, prepared, logicalModelCalls: 1, value, evidenceAudit, crossClause,
    behavioralStatus: 'not-evaluated', preExecStatus: 'not-executed-by-generation-entry'};
}

export function assertNarrativePreparation(source: NarrativeInput, context: OperationModelGrounding,
  prepared: ReturnType<typeof prepareNarrativeObligationGuidedInput>, mode: NarrativeMode = 'E') {
  const rebuilt = prepareNarrativeObligationGuidedInput(source, context, mode);
  if (ccHash({Tn: prepared.Tn, R: prepared.R, compatibility: prepared.compatibility, trace: prepared.trace}) !==
    ccHash({Tn: rebuilt.Tn, R: rebuilt.R, compatibility: rebuilt.compatibility, trace: rebuilt.trace}))
    throw new Error('Narrative preparation/relationship permissions altered');
  return true;
}
