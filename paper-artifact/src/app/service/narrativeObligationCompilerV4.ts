import {ccHash} from './crossClauseGraph';
import type {NarrativeInput} from './narrativeObligationCompiler';
import {frames4, action4, guard4, type Span4, type Frame4} from './narrativeV4Syntax';

const escape4 = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function parameterMentionsV4(text: string, names: string[], modelTypes: string[]) {
  return names.filter(name => [...text.matchAll(new RegExp(`\\b${escape4(name)}\\b`, 'g'))].some(match => {
    const prefix = text.slice(0, match.index!);
    return !prefix.endsWith('.') && !new RegExp(`\\b(?:${['attribute', 'property', ...modelTypes.map(escape4)].join('|')})\\s+$`, 'i').test(prefix);
  }));
}
export type Task4 = {
  taskId: string; category: 'precondition' | 'postcondition' | 'unresolved'; obligationText: string;
  sourceSpans: Span4[]; contextSpans: Span4[]; conditionScope: Frame4['scope']; sharedSubject: Span4 | null;
  behavioralAction: {kind: 'existence' | 'state-guard' | 'create' | 'delete' | 'associate' | 'update' | 'return' | 'conditional' | 'unknown';
    actorRole: 'system-or-operation' | 'source-subject' | 'unresolved'; targetRoleCandidates: string[]; attributeCandidates: string[]; parameterRefs: string[]};
  referencedRoles: string[]; referencedParameters: string[];
  candidateCategories: string[]; extractionStatus: 'explicit' | 'inferred-candidate' | 'ambiguous';
  provenance: string[]; rationale: string; unresolvedReason: string | null;
};
export function compileNarrativeObligationsV4(input: NarrativeInput) {
  if (ccHash(input.narrativeRequirement) !== input.sourceHash) throw new Error('Narrative V4 source hash mismatch');
  if (/^\s*(?:Preconditions|Postconditions|Operation intent):/im.test(input.narrativeRequirement)) throw new Error('Narrative source must not be structured labels');
  const text = input.narrativeRequirement;
  const tasks: Task4[] = [], seen = new Set<string>(), suppressed: {span: Span4; reason: string}[] = [];
  let noAdditionalPreconditionDeclared = false;
  for (const frame of frames4(text)) {
    const value = frame.span.exactText;
    if (frame.rule === 'eligibility-main-clause' && /\bis available\s*$/i.test(value)) {
      suppressed.push({span: frame.span, reason: 'Availability heading belongs to the explicit following eligibility scope, not an extra effect.'}); continue;
    }
    if (/\bno additional business (?:condition|restriction)\b/i.test(value)) {
      noAdditionalPreconditionDeclared = true;
      if (!/\breturns?\b/i.test(value)) {suppressed.push({span: frame.span, reason: 'Explicit absence of extra guard; not a business restriction.'}); continue;}
    }
    let category: Task4['category'] = frame.force ?? 'unresolved';
    const pre = guard4.test(value) || /\b(?:must|shall)\s+(?:already\s+|both\s+|also\s+|not\s+)?\w+/i.test(value);
    const post = action4.test(value) || /\b(?:is|are) (?:included|removed|linked|stored|cleared|marked)|\b(?:due date is|flags (?:are|start)|status becomes|remains?|contributes?)\b|^The new\s+\w+\s+is\b/i.test(value);
    if (!frame.force) category = pre && !post ? 'precondition' : post && !pre ? 'postcondition' : 'unresolved';
    // A branch's condition never becomes a global operation guard.
    if (frame.scope.kind === 'branch' || frame.scope.kind === 'trigger') category = post ? 'postcondition' : 'unresolved';
    const kind: Task4['behavioralAction']['kind'] = category === 'precondition' ? /exist|present|found|unused/i.test(value) ? 'existence' : 'state-guard' :
      /\breturns?|\breturning\b/i.test(value) ? 'return' : /\bcreat\w*|\bnew\b.*\b(?:included|record)/i.test(value) ? 'create' :
      /\bremov\w*|\bdelet\w*/i.test(value) ? 'delete' : /\blink\w*|\battach\w*|\bassociat\w*/i.test(value) ? 'associate' :
      /\b(?:set|change|increas|decreas|reduc|deduct|updat|mark|clear|reset|become|record|extend|remain|contribut)\w*/i.test(value) ? 'update' :
      frame.scope.kind === 'branch' ? 'conditional' : 'unknown';
    const key = ccHash({span: frame.span, category, scope: frame.scope});
    if (seen.has(key)) {suppressed.push({span: frame.span, reason: 'Exact duplicate sourced task frame.'}); continue;}
    seen.add(key);
    const referencedRoles = input.modelTypes.filter(type => new RegExp(`\\b${escape4(type)}s?\\b`, 'i').test(value));
    const parameters = parameterMentionsV4(value, input.parameters, input.modelTypes);
    const unresolvedReason = category !== 'unresolved' ? null : pre && post ? 'Mixed guard/effect without a reliable clause boundary' :
      frame.scope.kind === 'unknown' ? 'Condition/antecedent scope incomplete' : 'No reliable supported action/eligibility cue';
    tasks.push({taskId: `${input.operationId}/narrative-v4-task/${frame.span.start}-${frame.span.end}/${kind}`,
      category, obligationText: value, sourceSpans: [frame.span], contextSpans: frame.context,
      conditionScope: frame.scope, sharedSubject: frame.inheritedSubject,
      behavioralAction: {kind, actorRole: /\b(?:system|operation|ATM)\b/i.test(value) ? 'system-or-operation' : frame.inheritedSubject ? 'source-subject' : 'unresolved',
        targetRoleCandidates: [], attributeCandidates: [], parameterRefs: parameters},
      referencedRoles, referencedParameters: parameters, candidateCategories: category === 'unresolved' ? ['precondition', 'postcondition', 'unresolved'] : [category],
      extractionStatus: category === 'unresolved' ? 'ambiguous' : frame.rule === 'explicit-eligibility-modifier' || frame.inheritedSubject ? 'inferred-candidate' : 'explicit',
      provenance: ['narrative-behavior-compiler-v4', input.sourceHash, frame.rule], rationale: frame.rule, unresolvedReason});
  }
  const contradictions: string[][] = [];
  for (const a of tasks.filter(task => /\bmust (?:not )?exist\b/i.test(task.obligationText)))
    for (const b of tasks.filter(task => task.taskId > a.taskId && /\bmust (?:not )?exist\b/i.test(task.obligationText))) {
      const subject = (value: string) => value.split(/\bmust\b/i)[0].trim().toLowerCase();
      if (subject(a.obligationText) === subject(b.obligationText) && /\bnot\b/.test(a.obligationText) !== /\bnot\b/.test(b.obligationText)) {
        contradictions.push([a.taskId, b.taskId]);
        for (const task of [a, b]) {task.category = 'unresolved'; task.extractionStatus = 'ambiguous'; task.unresolvedReason = 'Contradictory explicit existence requirements';}
      }
    }
  const operationNames = [...text.matchAll(/\boperation\s+([a-z_]\w*)\s+(?:requires|returns|creates|must)\b/gi)].map(match => match[1]);
  const boundaryAmbiguous = new Set(operationNames).size > 1;
  if (boundaryAmbiguous) for (const task of tasks) {task.category = 'unresolved'; task.unresolvedReason = 'Multiple named operations with unassigned boundary';}
  const body = {version: 'narrative-obligation-plan-v4' as const, operationId: input.operationId, sourceHash: input.sourceHash,
    inputIdentityHash: ccHash(input), modelHash: input.modelHash ?? null, tasks, suppressed, contradictions, boundaryAmbiguous,
    noAdditionalPreconditionDeclared, unresolved: tasks.filter(task => task.category === 'unresolved').map(task => task.taskId),
    missingInformation: tasks.some(task => task.behavioralAction.kind === 'return') ? [] : ['No explicit return behavior recognized'], semanticCompletenessProven: false};
  return {...body, planHash: ccHash(body)};
}
export function assertNarrativePlanV4(input: NarrativeInput, plan: ReturnType<typeof compileNarrativeObligationsV4>) {
  if (ccHash(plan) !== ccHash(compileNarrativeObligationsV4(input))) throw new Error('Narrative V4 immutable plan changed');
  return true;
}
export type Plan4 = ReturnType<typeof compileNarrativeObligationsV4>;
