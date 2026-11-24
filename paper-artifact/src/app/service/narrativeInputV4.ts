import policy from '../../../config/constraint-solving-policy.json';
import {HumanMessage, type BaseMessage} from '@langchain/core/messages';
import type {NarrativeInput} from './narrativeObligationCompiler';
import {compileNarrativeObligationsV4, type Plan4} from './narrativeObligationCompilerV4';
import {resolveNarrativeRolesV4} from './narrativeRoleResolverV4';
import {compileNarrativeRelationsV4} from './narrativeRelationCompilerV4';
import {prepareNarrativeObligationGuidedInput} from './narrativeJointGeneration';
import type {OperationModelGrounding} from './operationModelGrounding';
import {CONSTRAINT_TASK_VERSION, assertConstraintTaskPlan, createConstraintTaskPlan, auditTaskEvidence, type ConstraintTaskPlan} from './constraintTaskPlan';
import {modelDeclarations} from './modelDeclarations';
import {selectOperationRelevantModel} from './operationRelevantModelSelector';
import {compilePackage25} from './crossClausePackage25';
import {compileOperationSpecificK} from './obligationGuidedInput';
import {auditCollaborative25} from './crossClauseCollaborative25';
import {taskSolutionSchema} from './constraintSolving';
import {ccHash} from './crossClauseGraph';
import {generationMessageTrace} from './generationMessageTrace';
import {narrativeMessageRequest, type NarrativeMessageRequest} from './narrativeTransport';

export function compatibility4(input: NarrativeInput, plan: Plan4, context: OperationModelGrounding) {
  const index = context.index;
  const lines = ['Operation intent:', input.narrativeRequirement.replace(/\r?\n/g, ' '), '', 'Preconditions:'];
  const mapping: {taskId: string; projectionId: string; projectionLine: number; sourceSpans: Plan4['tasks'][number]['sourceSpans']}[] = [];
  const tasks: ConstraintTaskPlan['tasks'] = [];
  for (const clause of ['precondition', 'postcondition'] as const) {
    if (clause === 'postcondition') lines.push('', 'Postconditions:');
    let number = 0;
    for (const task of plan.tasks.filter(task => task.category === clause)) {
      const id = `${index.operation.id}/constraint-task/${clause === 'precondition' ? 'P' : 'Q'}${++number}`;
      const requirement = task.obligationText.replace(/\r?\n/g, ' ');
      lines.push(`- ${requirement}`);
      mapping.push({taskId: task.taskId, projectionId: id, projectionLine: lines.length, sourceSpans: task.sourceSpans});
      tasks.push({id, clause, requirement, requirementLine: lines.length, modelHints: [], bindingBasis: 'literal-model-name-mentions-not-semantic-resolution'});
    }
  }
  const text = lines.join('\n');
  const body: Omit<ConstraintTaskPlan, 'hash'> = {version: CONSTRAINT_TASK_VERSION, operationId: index.operation.id,
    requirementHash: ccHash(input.narrativeRequirement), modelRulesHash: context.rules.rulesHash, policyHash: ccHash(policy),
    intent: input.narrativeRequirement, tasks, declarations: modelDeclarations(index), rules: structuredClone(policy.rules)};
  const projection = tasks.some(task => task.clause === 'precondition') && tasks.some(task => task.clause === 'postcondition') ?
    createConstraintTaskPlan(text, context) : {...body, hash: ccHash(body)};
  assertConstraintTaskPlan(projection, context);
  return {version: 'narrative-api-projection-v4', projection, text, mapping, sourcePlanHash: plan.planHash,
    policy: 'sourceAdapter' in plan ? 'Projection lines are generated view coordinates, not source lines. Current Structured source adapter provides tasks.' :
      'Projection lines are generated view coordinates, not source lines. Only current Narrative Tn provides tasks.'};
}

export function prepareNarrativeInputV4(source: NarrativeInput, context: OperationModelGrounding, options: {enabled?: boolean; modelSelection?: boolean} = {}) {
  // The legacy preparation also checks the public input and model authority. Its system message is reused byte-for-byte.
  const baseline = prepareNarrativeObligationGuidedInput(source, context, 'E', {modelSelection: options.modelSelection ?? true});
  if (options.enabled === false) return {enabled: false as const, baseline};
  const input = {...source, modelHash: ccHash(context)};
  const plan = compileNarrativeObligationsV4(input);
  return assembleUnifiedInputV4(source, context, input, plan, baseline, options);
}
type OriginalSections = ReturnType<typeof prepareNarrativeObligationGuidedInput>['sections'];
export type UnifiedInputBaseline = {sections: Pick<OriginalSections, 'version' | 'mode' | 'NarrativeRequirement' | 'OperationSignature' |
  'ModelContext' | 'ModelRules' | 'GenerationProtocol'> & {DerivedObligationPlan: unknown; CrossObligationRelations?: unknown; K?: unknown};
  messages: BaseMessage[]; requestHash: string};
/** Source-neutral downstream engine; no role/relation/K rules are duplicated by adapters. */
export function assembleUnifiedInputV4(source: NarrativeInput, context: OperationModelGrounding, input: NarrativeInput, plan: Plan4,
  baseline: UnifiedInputBaseline, options: {modelSelection?: boolean} = {},
  validatePlan?: (input: NarrativeInput, plan: Plan4) => boolean) {
  const roles = resolveNarrativeRolesV4(input, plan, context, validatePlan);
  const relations = compileNarrativeRelationsV4(input, plan, roles, validatePlan);
  const compatibility = compatibility4(input, plan, context);
  const uncertainRoleTasks = roles.taskRoles.filter(task => task.unresolved && plan.tasks.find(candidate => candidate.taskId === task.taskId)?.behavioralAction.kind !== 'return');
  const select = options.modelSelection !== false && plan.unresolved.length === 0 && uncertainRoleTasks.length === 0;
  const selection = selectOperationRelevantModel(compatibility.projection, context, null, select);
  const originalK = compilePackage25(compatibility.projection, context);
  const K = compileOperationSpecificK(originalK, null, selection);
  const coordinate = (span: {start: number; end: number}) => ({start: span.start, end: span.end});
  const planView = {...plan, tasks: plan.tasks.map(task => ({...task,
    sourceSpans: task.sourceSpans.map(coordinate), contextSpans: task.contextSpans.map(coordinate),
    conditionScope: {...task.conditionScope, evidence: task.conditionScope.evidence.map(coordinate)},
    sharedSubject: task.sharedSubject ? coordinate(task.sharedSubject) : null})),
    suppressed: plan.suppressed.map(item => ({...item, span: coordinate(item.span)}))};
  for (const task of plan.tasks) for (const span of [...task.sourceSpans, ...task.contextSpans, ...task.conditionScope.evidence])
    if (source.narrativeRequirement.slice(span.start, span.end) !== span.exactText) throw new Error('Source-coordinate compaction loses evidence');
  const inputK = {...K.input, version: 'narrative-operation-k-v4', planHash: plan.planHash,
    operationSpecific: {...K.input.operationSpecific, relationRefs: relations.generation.map(relation => relation.id)},
    unresolvedSemanticRelations: relations.raw.filter(relation => relation.status === 'unresolved').map(relation => ({id: relation.id, status: 'unresolved'})),
    sourceMapping: compatibility.mapping.map(item => ({...item, sourceSpans: item.sourceSpans.map(coordinate)})), unresolvedTaskIds: plan.unresolved};
  const sections = {...baseline.sections, version: 'narrative-joint-input-v4', DerivedObligationPlan: planView,
    CrossObligationRelations: {version: relations.version, planHash: plan.planHash, generation: relations.generation,
      rawAuditHash: relations.hash, reviewedCount: relations.reviewed.length, hardBusinessConstraints: 0},
    BehavioralRoleMapping: {version: roles.version, roles: roles.roles, tasks: roles.taskRoles.map(task => ({...task, evidenceSpans: task.evidenceSpans.map(coordinate)}))},
    SourceCoordinateConvention: 'All source/context/subject coordinates are zero-based, end-exclusive UTF-16 spans into NarrativeRequirement.text. Exact text is reconstructed by slice(start,end); complete text-bearing audit objects are retained outside the request.',
    ModelContext: selection.inputView, K: inputK,
    GenerationProtocol: {...baseline.sections.GenerationProtocol, planHash: plan.planHash,
      issuedTaskIds: plan.tasks.filter(task => task.category !== 'unresolved').map(task => task.taskId), unresolvedTaskIds: plan.unresolved}};
  const messages = [baseline.messages[0], new HumanMessage(JSON.stringify(sections))];
  if (messages[0].content !== baseline.messages[0].content) throw new Error('Joint generation prompt changed');
  const body = {input, Tn: plan, RoleMapping: roles, R: relations, compatibility, selection, K: {original: K, input: inputK},
    sections, requestHash: ccHash(messages.map(message => message.content)), fullModelHash: ccHash(context)};
  return {enabled: true as const, ...body, messages, trace: generationMessageTrace('dry-run-unselected-model', messages),
    baselineRequestHash: baseline.requestHash, systemPromptUnchanged: true,
    modelFallbackAudit: {uncertainRoleTasks: uncertainRoleTasks.map(task => task.taskId), unresolvedTasks: plan.unresolved,
      reasons: selection.fallbackReasons, sourceOfSelection: 'Existing authoritative selector, conservative fallback when current role/condition evidence is insufficient'},
    preparationHash: ccHash(body), modelCalls: 0};
}
export function assertNarrativeInputV4(source: NarrativeInput, context: OperationModelGrounding, prepared: ReturnType<typeof prepareNarrativeInputV4>, options: {modelSelection?: boolean} = {}) {
  if (!prepared.enabled) return true;
  const rebuilt = prepareNarrativeInputV4(source, context, options);
  if (!rebuilt.enabled || prepared.preparationHash !== rebuilt.preparationHash || ccHash(prepared.sections) !== ccHash(rebuilt.sections) ||
    ccHash(prepared.R) !== ccHash(rebuilt.R) || ccHash(prepared.Tn) !== ccHash(rebuilt.Tn) ||
    ccHash(prepared.RoleMapping) !== ccHash(rebuilt.RoleMapping) || ccHash(prepared.K) !== ccHash(rebuilt.K) ||
    ccHash(prepared.compatibility) !== ccHash(rebuilt.compatibility) || ccHash(prepared.selection) !== ccHash(rebuilt.selection) ||
    ccHash(prepared.messages.map(message => message.content)) !== ccHash(rebuilt.messages.map(message => message.content)))
    throw new Error('Immutable Narrative V4 preparation changed');
  return true;
}

/** Same single joint-solving transport and original response schema; only compiled input differs. */
export async function runNarrativeInputV4(source: NarrativeInput, context: OperationModelGrounding,
  options: {transport?: (request: NarrativeMessageRequest) => Promise<{value: unknown}>} = {}) {
  const prepared = prepareNarrativeInputV4(source, context);
  if (!prepared.enabled) throw new Error('V4 entry disabled');
  if (!options.transport) return {prepared, logicalModelCalls: 0, prepareOnly: true};
  const identity = ccHash({source, context});
  const response = await options.transport(narrativeMessageRequest(prepared.messages));
  if (ccHash({source, context}) !== identity) throw new Error('Transport changed source or model');
  assertNarrativeInputV4(source, context, prepared);
  const result = taskSolutionSchema.parse(response.value);
  if (result.planHash !== prepared.Tn.planHash) throw new Error('Wrong Narrative V4 plan hash');
  const evidence = result.taskEvidence.map(item => {
    const mapped = prepared.compatibility.mapping.find(mapping => mapping.taskId === item.taskId);
    if (!mapped) throw new Error('Unknown/unresolved V4 evidence task');
    return {...item, taskId: mapped.projectionId};
  });
  const candidate = {...result.contract, definition: result.contract.definition ?? ''};
  const plan = prepared.compatibility.projection;
  return {prepared, logicalModelCalls: 1, prepareOnly: false, result,
    evidence: auditTaskEvidence(plan, candidate, evidence, context),
    crossClause: auditCollaborative25({plan, context, candidate, taskEvidence: evidence}, prepared.K.original.original),
    hiddenJestEvaluations: 0};
}
