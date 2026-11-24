import policy from '../../../config/constraint-solving-policy.json';
import {CONSTRAINT_TASK_VERSION, assertConstraintTaskPlan, createConstraintTaskPlan, type ConstraintTaskPlan} from './constraintTaskPlan';
import {modelDeclarations} from './modelDeclarations';
import type {OperationModelGrounding} from './operationModelGrounding';
import {ccHash} from './crossClauseGraph';
import {assertNarrativePlan, type NarrativeInput, type compileNarrativeObligations} from './narrativeObligationCompiler';
import {compileObligationRelations} from './obligationRelationCompiler';
import {selectOperationRelevantModel} from './operationRelevantModelSelector';
import {compilePackage25} from './crossClausePackage25';
import {compileOperationSpecificK} from './obligationGuidedInput';

export function compileNarrativeCompatibility(input: NarrativeInput, tn: ReturnType<typeof compileNarrativeObligations>, context: OperationModelGrounding, selectModel = true) {
  assertNarrativePlan(input, tn);
  const operation = context.index.operation;
  if (operation.parameters.map(parameter => parameter.name).join('|') !== input.parameters.join('|') ||
    ccHash(context.index.entities.map(entity => entity.name)) !== ccHash(input.modelTypes)) throw new Error('Narrative/model declaration identity mismatch');
  const classified = tn.tasks.filter(task => task.category !== 'unresolved');
  const lines = ['Operation intent:', input.narrativeRequirement.replace(/\r?\n/g, ' '), '', 'Preconditions:'];
  const mapping: {narrativeTaskId: string; projectionTaskId: string; projectionLine: number; sourceSpans: typeof tn.tasks[number]['sourceSpans']}[] = [];
  const tasks: ConstraintTaskPlan['tasks'] = [];
  for (const clause of ['precondition', 'postcondition'] as const) {
    if (clause === 'postcondition') lines.push('', 'Postconditions:');
    let count = 0;
    for (const task of classified.filter(task => task.category === clause)) {
      const id = `${operation.id}/constraint-task/${clause === 'precondition' ? 'P' : 'Q'}${++count}`;
      const text = task.obligationText.replace(/\r?\n/g, ' ');
      lines.push(`- ${text}`);
      mapping.push({narrativeTaskId: task.taskId, projectionTaskId: id, projectionLine: lines.length, sourceSpans: task.sourceSpans});
      tasks.push({id, clause, requirement: text, requirementLine: lines.length, modelHints: [], bindingBasis: 'literal-model-name-mentions-not-semantic-resolution'});
    }
  }
  const projectionText = lines.join('\n');
  // This is an explicitly derived API view, not the historical v4 input or its plan identity.
  const body: Omit<ConstraintTaskPlan, 'hash'> = {version: CONSTRAINT_TASK_VERSION, operationId: operation.id,
    requirementHash: ccHash(input.narrativeRequirement), modelRulesHash: context.rules.rulesHash, policyHash: ccHash(policy),
    intent: input.narrativeRequirement, tasks, declarations: modelDeclarations(context.index), rules: structuredClone(policy.rules)};
  let apiView: ConstraintTaskPlan = {...body, hash: ccHash(body)};
  const bothClauses = tasks.some(task => task.clause === 'precondition') && tasks.some(task => task.clause === 'postcondition');
  if (bothClauses) apiView = createConstraintTaskPlan(projectionText, context);
  assertConstraintTaskPlan(apiView, context);
  const legacyRelations = bothClauses ? compileObligationRelations(apiView, context, projectionText) : null;
  const uncertain = tn.unresolved.length > 0 || tn.contradictions.length > 0;
  const selection = selectOperationRelevantModel(apiView, context, legacyRelations, !uncertain && selectModel);
  const originalK = compilePackage25(apiView, context);
  const operationK = compileOperationSpecificK(originalK, legacyRelations, selection);
  const kInput = {...operationK.input, version: 'narrative-operation-k-v1', planHash: tn.planHash,
    sourceMapping: mapping, projectionHash: apiView.hash,
    scope: 'Hard scope/type/state rules apply; extracted clause ownership is a candidate interpretation, not a certified business fact.',
    unresolvedTaskIds: tn.unresolved};
  return {version: 'narrative-legacy-api-view-v1', sourcePlanHash: tn.planHash, sourceHash: input.sourceHash,
    projectionText, projectionPlan: apiView, mapping, legacyRelations, selection,
    K: {input: kInput, audit: operationK, hash: ccHash(kInput)},
    fallbackReason: uncertain ? 'Unresolved narrative obligations: full authoritative model retained.' : null,
    provenancePolicy: 'Projection line numbers refer ONLY to this generated compatibility view; narrative source offsets are in mapping. Projection tasks are not original v4 tasks.'};
}
