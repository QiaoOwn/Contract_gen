import {createHash} from 'node:crypto';
import {ccHash} from './crossClauseGraph';
import {prepareNarrativeInputV4} from './narrativeInputV4';
import type {NarrativeInput} from './narrativeObligationCompiler';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {ConstraintTaskPlan} from './constraintTaskPlan';

export type NarrativeGenerationIdentity = {version: 'narrative-generation-identity-v1'; source: NarrativeInput;
  modelHash: string; narrativePlanHash: string; projectionPlanHash: string; preparationHash: string};
export function createNarrativeGenerationIdentity(source: NarrativeInput, context: OperationModelGrounding): NarrativeGenerationIdentity {
  const prepared = prepareNarrativeInputV4(source, context, {modelSelection: false});
  if (!prepared.enabled) throw new Error('Narrative V4 disabled');
  return {version: 'narrative-generation-identity-v1', source: structuredClone(prepared.input), modelHash: ccHash(context),
    narrativePlanHash: prepared.Tn.planHash, projectionPlanHash: prepared.compatibility.projection.hash,
    preparationHash: prepared.preparationHash};
}
export function verifyNarrativeGenerationIdentity(param: {plan: ConstraintTaskPlan; context: OperationModelGrounding;
  input: string; requirement: string; inputHash: string; narrativeIdentity: NarrativeGenerationIdentity}) {
  const identity = param.narrativeIdentity;
  if (identity.version !== 'narrative-generation-identity-v1' || identity.modelHash !== ccHash(param.context)) throw new Error('Narrative identity/model mismatch');
  const rebuilt = prepareNarrativeInputV4(identity.source, param.context, {modelSelection: false});
  if (!rebuilt.enabled || rebuilt.Tn.planHash !== identity.narrativePlanHash || rebuilt.preparationHash !== identity.preparationHash ||
    rebuilt.compatibility.projection.hash !== identity.projectionPlanHash || ccHash(param.plan) !== ccHash(rebuilt.compatibility.projection) ||
    param.requirement !== identity.source.narrativeRequirement || param.input !== JSON.stringify(rebuilt.sections) ||
    createHash('sha256').update(param.input).digest('hex') !== param.inputHash)
    throw new Error('Narrative request/plan/source identity changed');
  return {version: 'narrative-generation-preflight-v1', ready: true, planHash: param.plan.hash, sourcePlanHash: rebuilt.Tn.planHash,
    inputHash: param.inputHash, requirementHash: param.plan.requirementHash, modelIndexHash: ccHash(param.context.index),
    modelRulesHash: param.context.rules.rulesHash, taskCompilationVerified: true, modelRuleCompilationVerified: true,
    taskCount: param.plan.tasks.length, allApplicableModelRuleIds: param.context.rules.rules.map(rule => rule.id),
    taskPreparation: rebuilt.compatibility.mapping.map(mapping => ({taskId: mapping.projectionId, narrativeTaskId: mapping.taskId,
      requirementLine: mapping.projectionLine, sourceSpans: mapping.sourceSpans,
      clause: param.plan.tasks.find(task => task.id === mapping.projectionId)!.clause, policyRuleIds: param.plan.rules.map(rule => rule.id),
      modelHints: param.plan.tasks.find(task => task.id === mapping.projectionId)!.modelHints,
      hintedModelRuleIds: [] as string[], bindingStatus: 'source-mapped-narrative-candidates'})),
    hintSemantics: 'Versioned Narrative source mappings, not recompiled Structured requirements',
    ownership: 'program-owns-tasks-and-acceptance-model-solves-expressions'};
}
