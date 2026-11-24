import {SystemMessage, HumanMessage} from '@langchain/core/messages';
import {createConstraintSolvingSystemPrompt, taskSolutionSchema} from './constraintSolving';
import type {CollaborativeTransport} from './crossClauseCollaborative';
import {prepareConstraintGeneration} from './constraintTaskPlan';
import {MODEL_RULE_FAMILIES} from './modelGroundingRules';
import {compileObligationRelations, auditObligationRelationSources, type ObligationRelationPlan} from './obligationRelationCompiler';
import {selectOperationRelevantModel} from './operationRelevantModelSelector';
import {compilePackage25, type Package25} from './crossClausePackage25';
import {ccHash} from './crossClauseGraph';
import {generationMessageTrace} from './generationMessageTrace';
import type {prepareCollaborativeRequest25} from './crossClauseCollaborative25';

type Params = Parameters<typeof prepareCollaborativeRequest25>[0];
export type InputOptimizationFlags = {organized: boolean; relations: boolean; modelSelection: boolean; compactK: boolean};
export const INPUT_OPTIMIZATION_MODES: Record<string, InputOptimizationFlags> = {
  v4: {organized: false, relations: false, modelSelection: false, compactK: false},
  layout: {organized: true, relations: false, modelSelection: false, compactK: false},
  model: {organized: true, relations: false, modelSelection: true, compactK: false},
  relations: {organized: true, relations: true, modelSelection: false, compactK: false},
  relationsK: {organized: true, relations: true, modelSelection: false, compactK: true},
  full: {organized: true, relations: true, modelSelection: true, compactK: true},
};

export function compileOperationSpecificK(pack: Package25, R: ObligationRelationPlan | null, selectedModel: ReturnType<typeof selectOperationRelevantModel>) {
  const input = {version: 'operation-specific-k-input-v1', planHash: pack.base.planHash,
    globalRules: pack.base.constraints.filter(constraint => constraint.enforcement === 'hard').map(({id, kind, condition, checker}) => ({id, kind, condition, checker})),
    candidateConditionalRules: pack.constraints.map(({id, kind, clauses, condition}) => ({id, kind, clauses, condition})),
    operationSpecific: {signature: pack.base.signature, parameterDeclarations: selectedModel.inputView.declarations.filter(item => item.id.includes('/parameter/')),
      validatedNavigationPaths: selectedModel.modelPaths, relationRefs: R?.relations.filter(relation => relation.verificationStatus !== 'unresolved').map(relation => relation.relationId) ?? []},
    unresolvedSemanticRelations: R?.relations.filter(relation => relation.verificationStatus === 'unresolved').map(relation => relation.relationId) ?? [],
    semanticPolicy: 'R references are advisory/not-checkable, never extra hard acceptance conditions. Distinct equivalent queries are permitted.'};
  const preserved = new Set([...input.globalRules, ...input.candidateConditionalRules].map(rule => ccHash({id: rule.id, condition: rule.condition})));
  const original = [...pack.base.constraints.filter(constraint => constraint.enforcement === 'hard'), ...pack.constraints];
  if (!original.every(rule => preserved.has(ccHash({id: rule.id, condition: rule.condition})))) throw new Error('Hard K condition lost');
  return {version: 'operation-specific-k-audit-v1', original: pack, relationPlan: R, input,
    preservation: {hardConditions: original.length, allRetainedExactly: true, additionalHardBusinessRelations: 0}, hash: ccHash(input)};
}

export function prepareObligationGuidedInput(param: Params, flags: InputOptimizationFlags = INPUT_OPTIMIZATION_MODES.v4) {
  prepareConstraintGeneration(param);
  if (param.previous || param.previousProposal || param.diagnostics.length) throw new Error('Input optimization entry is first-generation preparation only');
  const initial = ccHash({plan: param.plan, context: param.context, requirement: param.requirement});
  const R = compileObligationRelations(param.plan, param.context, param.requirement);
  const sourceAudit = auditObligationRelationSources(param.plan, param.context, param.requirement, R);
  const selection = selectOperationRelevantModel(param.plan, param.context, flags.relations ? R : null, flags.modelSelection);
  const K = compileOperationSpecificK(compilePackage25(param.plan, param.context), flags.relations ? R : null, selection);
  const baseline = [new SystemMessage(createConstraintSolvingSystemPrompt()), new HumanMessage(param.input)];
  if (!flags.organized && (flags.relations || flags.modelSelection || flags.compactK)) throw new Error('Enable organized input for independent enhancements');
  const taskPrefix = `${param.plan.operationId}/constraint-task/`;
  const modelView = {...selection.inputView, declarations: selection.inputView.declarations.map((declaration, index) => ({ref: `m${index + 1}`, ...declaration}))};
  const modelRef = (id: string) => modelView.declarations.find(declaration => declaration.id === id)?.ref ?? id;
  const roleRef = (id: string | null) => id === null ? null : id.startsWith(taskPrefix) ? id.slice(taskPrefix.length) : modelRef(id);
  const relationView = {version: R.version, relationPrefix: `${param.plan.operationId}/R/`, taskPrefix,
    relations: R.relations.map(relation => ({id: relation.relationId.split('/R/')[1], type: relation.relationType,
      from: relation.sourceTaskIds.map(id => id.slice(taskPrefix.length)), to: relation.targetTaskIds.map(id => id.slice(taskPrefix.length)),
      subjectRole: roleRef(relation.subjectRole), objectRole: roleRef(relation.objectRole),
      evidence: relation.sourceEvidence.spans.map(({line, start, end}) => ({line, start, end})),
      modelCandidates: relation.modelCandidates.map(modelRef), status: relation.verificationStatus, enforceability: relation.enforceability})),
    parameterRoles: R.parameters.map(role => ({parameter: modelRef(role.parameterId), tasks: role.taskIds.map(id => id.slice(taskPrefix.length))})),
    intentCues: R.intentCues.map(cue => ({text: cue.text, spans: cue.spans, modelCandidates: cue.modelCandidates.map(modelRef), parameterCandidates: cue.parameterCandidates.map(modelRef), status: cue.status})),
    interpretation: 'Role suffixes are task-scoped source mentions, not OCL variables. Grounded means sourced text, not proved object identity. Advisory relations permit independently equivalent queries.'};
  const operation = param.context.index.operation;
  const groundingStart = param.input.indexOf('Grounding constraints:\n');
  const groundingEnd = param.input.indexOf('\n\n', groundingStart);
  if (groundingStart < 0 || groundingEnd < groundingStart) throw new Error('Canonical grounding section missing');
  const groundingConstraints = param.input.slice(groundingStart + 'Grounding constraints:\n'.length, groundingEnd).split('\n');
  const sections = {
    Operation: {signature: K.original.base.signature, service: operation.service, intent: param.plan.intent},
    RequirementObligations: {planHash: param.plan.hash, tasks: param.plan.tasks.map(({id, clause, requirement, requirementLine}) => ({id, key: id.slice(taskPrefix.length), clause, requirement, requirementLine}))},
    ...(flags.relations ? {CrossObligationRelations: relationView} : {}),
    ModelContext: modelView,
    GlobalModelRules: MODEL_RULE_FAMILIES.map(({id, meaning}) => ({id, meaning})),
    GroundingConstraints: groundingConstraints,
    TaskRules: param.plan.rules,
    ...(flags.compactK ? {K: {...K.input, operationSpecific: {...K.input.operationSpecific,
      parameterDeclarations: K.input.operationSpecific.parameterDeclarations.map(declaration => modelRef(declaration.id)),
      validatedNavigationPaths: K.input.operationSpecific.validatedNavigationPaths.map(path => ({from: modelRef(path.from), to: modelRef(path.to), features: path.featureIds.map(modelRef)})),
      relationRefs: K.input.operationSpecific.relationRefs.map(id => id.split('/R/')[1])},
      unresolvedSemanticRelations: K.input.unresolvedSemanticRelations.map(id => id.split('/R/')[1])}} : {}),
    GenerationProtocol: {planHash: param.plan.hash, schema: 'unchanged taskSolutionSchema', joint: 'One complete D/P/Q envelope in one call; no reference expressions supplied'},
  };
  const messages = flags.organized ? [baseline[0], new HumanMessage(JSON.stringify(sections))] : baseline;
  if (initial !== ccHash({plan: param.plan, context: param.context, requirement: param.requirement})) throw new Error('Input authority modified');
  return {mode: flags.organized ? 'obligationGuided' : 'constraintSolving', flags: {...flags}, R, selection, K, sourceAudit,
    fullAuthority: param.context, immutableTaskPlan: param.plan, sections, messages,
    trace: generationMessageTrace(String(param.model), messages), inputHash: ccHash(messages.map(message => message.content)),
    componentCharacters: {operation: JSON.stringify(sections.Operation).length, T: JSON.stringify(sections.RequirementObligations).length,
      R: flags.relations ? JSON.stringify(relationView).length : 0, model: JSON.stringify(sections.ModelContext).length,
      K: flags.compactK ? JSON.stringify(sections.K).length : 0, system: String(messages[0].content).length},
    modelCalls: 0};
}

export function assertObligationGuidedInput(param: Params, prepared: ReturnType<typeof prepareObligationGuidedInput>) {
  const rebuilt = prepareObligationGuidedInput(param, prepared.flags);
  if (ccHash(rebuilt.trace) !== ccHash(prepared.trace) || rebuilt.R.hash !== prepared.R.hash || rebuilt.selection.modelHash !== prepared.selection.modelHash)
    throw new Error('Optimized input differs from immutable compilation');
  return {ready: true, semanticRelationsAreAdvisory: true, taskPlanHash: param.plan.hash};
}

export async function runObligationGuidedGeneration(param: Params, options: {
  flags?: InputOptimizationFlags; transport?: CollaborativeTransport;
} = {}) {
  const prepared = prepareObligationGuidedInput(param, options.flags ?? INPUT_OPTIMIZATION_MODES.v4);
  if (!options.transport) return {prepareOnly: true, prepared, logicalModelCalls: 0};
  const before = ccHash({plan: param.plan, context: param.context, requirement: param.requirement});
  const response = await options.transport({messages: prepared.messages});
  if (before !== ccHash({plan: param.plan, context: param.context, requirement: param.requirement})) throw new Error('Generation transport changed immutable input');
  assertObligationGuidedInput(param, prepared);
  const parsed = taskSolutionSchema.safeParse(response.value);
  return {prepareOnly: false, prepared, response, logicalModelCalls: 1,
    protocolAccepted: parsed.success && parsed.data.planHash === param.plan.hash,
    candidate: parsed.success ? parsed.data.contract : null,
    semanticStatus: 'not-established-by-output-protocol; use full-model common backend and independent terminal evaluation'};
}
