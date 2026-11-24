import {ccHash} from './crossClauseGraph';
import {createConstraintTaskPlan} from './constraintTaskPlan';
import {compileNarrativeObligationsV4, parameterMentionsV4, type Plan4, type Task4} from './narrativeObligationCompilerV4';
import type {NarrativeInput} from './narrativeObligationCompiler';
import type {OperationModelGrounding} from './operationModelGrounding';
import {sourceSpan4} from './narrativeV4Syntax';

export type StructuredTn = Plan4 & {sourceAdapter: {version: 'structured-tn-adapter-v1'; format: 'Structured-v4';
  originalTaskPlanHash: string; taskMapping: {sourceTaskId: string; taskId: string | null; line: number; start: number; end: number; status: string}[]}};

/** P/Q ownership and task boundaries come exclusively from the frozen Structured bullets. */
export function compileStructuredTn(input: NarrativeInput, context: OperationModelGrounding): StructuredTn {
  if (ccHash(input.narrativeRequirement) !== input.sourceHash || input.modelHash !== ccHash(context)) throw new Error('Structured source/model identity mismatch');
  const source = createConstraintTaskPlan(input.narrativeRequirement, context);
  const lines = [...input.narrativeRequirement.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)];
  const tasks: Task4[] = [], suppressed: Plan4['suppressed'] = [], taskMapping: StructuredTn['sourceAdapter']['taskMapping'] = [];
  let noAdditionalPreconditionDeclared = false;
  for (const original of source.tasks) {
    const line = lines[original.requirementLine - 1];
    const offset = line[0].indexOf(original.requirement);
    if (offset < 0) throw new Error('Structured task cannot be mapped to exact source');
    const span = sourceSpan4(input.narrativeRequirement, line.index! + offset, line.index! + offset + original.requirement.length);
    // Reuse existing V4 metadata analysis only. Its task boundaries/categories never replace the labelled source task.
    const attributes = compileNarrativeObligationsV4({...input, narrativeRequirement: original.requirement, sourceHash: ccHash(original.requirement)});
    const shift = (s: {start: number; end: number}) => sourceSpan4(input.narrativeRequirement, span.start + s.start, span.start + s.end);
    if (original.clause === 'precondition' && attributes.noAdditionalPreconditionDeclared && attributes.tasks.length === 0) {
      noAdditionalPreconditionDeclared = true;
      suppressed.push({span, reason: 'Existing V4 no-extra-guard declaration; not a business precondition task'});
      taskMapping.push({sourceTaskId: original.id, taskId: null, line: original.requirementLine, start: span.start, end: span.end, status: 'no-extra-global-guard-declaration'});
      continue;
    }
    const scopes = [...new Map(attributes.tasks.map(task => [ccHash(task.conditionScope), task.conditionScope])).values()];
    const scope = scopes.length === 1 ? {...scopes[0], evidence: scopes[0].evidence.map(shift)} :
      {kind: 'unknown' as const, evidence: [] as ReturnType<typeof sourceSpan4>[], polarity: 'unspecified' as const};
    const actions = [...new Set(attributes.tasks.map(task => task.behavioralAction.kind))];
    const action = actions.length === 1 ? actions[0] : 'unknown';
    const taskId = `${input.operationId}/structured-task/${original.clause === 'precondition' ? 'P' : 'Q'}/${span.start}-${span.end}`;
    const parameters = parameterMentionsV4(original.requirement, input.parameters, input.modelTypes);
    tasks.push({taskId, category: original.clause, obligationText: span.exactText, sourceSpans: [span], contextSpans: [span],
      conditionScope: scope, sharedSubject: null,
      behavioralAction: {kind: action, actorRole: 'unresolved', targetRoleCandidates: [], attributeCandidates: [], parameterRefs: parameters},
      referencedRoles: [...new Set(attributes.tasks.flatMap(task => task.referencedRoles))], referencedParameters: parameters,
      candidateCategories: [original.clause], extractionStatus: 'explicit', provenance: ['structured-tn-adapter-v1', input.sourceHash, original.id],
      rationale: 'Explicit source P/Q label and whole-bullet boundary; existing V4 metadata only',
      unresolvedReason: scope.kind === 'unknown' || action === 'unknown' ? 'Action/scope attributes not uniquely resolved; source P/Q label remains explicit' : null});
    taskMapping.push({sourceTaskId: original.id, taskId, line: original.requirementLine, start: span.start, end: span.end, status: 'explicit-source-task'});
  }
  const body = {version: 'narrative-obligation-plan-v4' as const, operationId: input.operationId, sourceHash: input.sourceHash,
    inputIdentityHash: ccHash(input), modelHash: input.modelHash, tasks, suppressed, contradictions: [] as Plan4['contradictions'],
    boundaryAmbiguous: false, noAdditionalPreconditionDeclared, unresolved: [] as string[],
    missingInformation: tasks.some(task => task.behavioralAction.kind === 'return') ? [] : ['Return action metadata not uniquely recognized'],
    semanticCompletenessProven: false as const,
    sourceAdapter: {version: 'structured-tn-adapter-v1' as const, format: 'Structured-v4' as const, originalTaskPlanHash: source.hash, taskMapping}};
  return {...body, planHash: ccHash(body)};
}
export function assertStructuredTn(input: NarrativeInput, plan: Plan4, context: OperationModelGrounding) {
  if (ccHash(plan) !== ccHash(compileStructuredTn(input, context))) throw new Error('Structured unified plan changed');
  return true;
}
