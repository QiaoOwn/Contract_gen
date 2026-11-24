import {ccHash} from './crossClauseGraph';
import type {NarrativeInput} from './narrativeObligationCompiler';
import {assertNarrativePlanV4, parameterMentionsV4, type Plan4} from './narrativeObligationCompilerV4';
import type {OperationModelGrounding} from './operationModelGrounding';
import {sourceSpan4, type Span4} from './narrativeV4Syntax';

type Role4 = {id: string; typeIds: string[]; qualifier: string; sourceMentions: string[]; businessIdentityProven: false};
export type Mention4 = {id: string; span: Span4; taskIds: string[]; modelCandidates: string[];
  kind: 'full-type' | 'model-alias' | 'anaphor'; qualifier: string;
  roleCandidates: string[]; status: 'grounded' | 'proposed' | 'unresolved'; basis: string};
const escape4 = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const words4 = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').toLowerCase();
const plural4 = (word: string) => /[^aeiou]y$/.test(word) ? word.slice(0, -1) + 'ies' : word + 's';

export function resolveNarrativeRolesV4(input: NarrativeInput, plan: Plan4, context: OperationModelGrounding,
  validatePlan: typeof assertNarrativePlanV4 = assertNarrativePlanV4) {
  validatePlan(input, plan);
  if (ccHash(context.index.entities.map(entity => entity.name)) !== ccHash(input.modelTypes)) throw new Error('Role authority differs from declared types');
  const text = input.narrativeRequirement;
  const forms = new Map<string, {typeIds: string[]; exact: boolean}>();
  const addForm = (form: string, id: string, exact: boolean) => {
    const old = forms.get(form);
    if (!old || exact && !old.exact) forms.set(form, {typeIds: [id], exact});
    else if (old.exact === exact && !old.typeIds.includes(id)) old.typeIds.push(id);
  };
  for (const entity of context.index.entities) {
    const normalized = words4(entity.name), parts = normalized.split(' ');
    for (const form of [entity.name.toLowerCase(), normalized, plural4(normalized)]) addForm(form, entity.id, true);
    if (parts.length > 1) for (const form of [parts.at(-1)!, parts.slice(0, -1).join(' ')]) {
      if (form.length >= 3) {addForm(form, entity.id, false); addForm(plural4(form), entity.id, false);}
    }
  }
  const hits: {span: Span4; typeIds: string[]; exact: boolean; form: string}[] = [];
  for (const [form, metadata] of forms) for (const match of text.matchAll(new RegExp(`\\b${escape4(form).replaceAll(' ', '[ -]')}\\b`, 'gi'))) {
    if (/^stores?$/i.test(match[0]) && /\b(?:system|operation|ATM|it)\s+$/i.test(text.slice(0, match.index!))) continue;
    hits.push({span: sourceSpan4(text, match.index!, match.index! + match[0].length), typeIds: metadata.typeIds, exact: metadata.exact, form});
  }
  const selected: typeof hits = [];
  for (const hit of hits.sort((a, b) => b.span.exactText.length - a.span.exactText.length || Number(b.exact) - Number(a.exact)))
    if (!selected.some(other => other.span.start < hit.span.end && other.span.end > hit.span.start)) selected.push(hit);
  selected.sort((a, b) => a.span.start - b.span.start);
  const roles: Role4[] = [], mentions: Mention4[] = [];
  const isPlural = (surface: string) => /s$/i.test(surface) && !/status$/i.test(surface);
  const qualifierAt = (start: number) => {
    const prefix = text.slice(Math.max(0, start - 45), start).split(/[.;,]/).at(-1)!.toLowerCase();
    if (/\bnewly created\s+$/.test(prefix)) return 'new';
    const words = prefix.match(/\w+/g) ?? [];
    const known = new Set(['new', 'current', 'referenced', 'requested', 'scanned', 'selected', 'corresponding', 'matching', 'another', 'other', 'different', 'previous', 'that', 'this', 'the']);
    for (const word of words.slice(-3).reverse()) if (known.has(word)) return word;
    return 'unspecified';
  };
  for (const hit of selected) {
    let qualifier = qualifierAt(hit.span.start);
    if (qualifier === 'newly created') qualifier = 'new';
    if (/\bcreat(?:e|es|ed|ing)\s+(?:a\s+|an\s+)?(?:new\s+)?(?:\w+\s+){0,1}$/i.test(text.slice(Math.max(0, hit.span.start - 35), hit.span.start))) qualifier = 'new';
    const taskIds = plan.tasks.filter(task => [...task.sourceSpans, ...(task.sharedSubject ? [task.sharedSubject] : [])]
      .some(span => span.start <= hit.span.start && span.end >= hit.span.end)).map(task => task.taskId);
    const uniqueTypes = hit.typeIds.length === 1;
    const compatible = roles.filter(role => role.typeIds.some(id => hit.typeIds.includes(id)));
    const explicitQualifier = ['current', 'new', 'newly created', 'referenced', 'requested', 'scanned', 'selected', 'corresponding', 'matching'].includes(qualifier);
    let candidates = explicitQualifier ? compatible.filter(role => role.qualifier === qualifier) : compatible;
    if (explicitQualifier && qualifier !== 'new' && candidates.length === 0 && compatible.length === 1 &&
      ['unspecified', 'the'].includes(compatible[0].qualifier)) candidates = compatible;
    if (['other', 'another', 'different', 'previous'].includes(qualifier)) candidates = [];
    const definite = explicitQualifier || ['the', 'that', 'this'].includes(qualifier);
    let roleCandidates = definite && candidates.length === 1 && !isPlural(hit.span.exactText) ? [candidates[0].id] : [];
    const id = `${input.operationId}/mention-v4/${hit.span.start}-${hit.span.end}`;
    if (!roleCandidates.length && uniqueTypes) {
      const role = {id: `${input.operationId}/role-v4/${hit.span.start}`, typeIds: [...hit.typeIds], qualifier,
        sourceMentions: [id], businessIdentityProven: false as const};
      roles.push(role); roleCandidates = [role.id];
    } else if (roleCandidates.length) roles.find(role => role.id === roleCandidates[0])!.sourceMentions.push(id);
    mentions.push({id, span: hit.span, taskIds, modelCandidates: [...hit.typeIds], kind: hit.exact ? 'full-type' : 'model-alias', qualifier,
      roleCandidates: roleCandidates.length ? roleCandidates : candidates.map(role => role.id),
      status: hit.exact && uniqueTypes ? 'grounded' : roleCandidates.length === 1 ? 'proposed' : 'unresolved',
      basis: explicitQualifier ? 'Repeated explicit role qualifier, candidate textual identity only' : definite ? 'Definite/demonstrative mention; unique compatible discourse role required' : 'Named type or model-derived alias, not evidence of shared instance'});
  }
  // Resolve pronouns after ordered noun mentions; retain alternatives instead of flattening all history into equality.
  for (const match of text.matchAll(/\b(?:it|its|that object|this object|that record|the record|that person)\b/gi)) {
    const span = sourceSpan4(text, match.index!, match.index! + match[0].length);
    if (mentions.some(mention => mention.span.start < span.end && mention.span.end > span.start)) continue;
    const tail = text.slice(span.end);
    if (/^it$/i.test(match[0]) && /^\s+(?:returns?|creates?|records?|requires?|stores?|adds?)\b/i.test(tail)) continue;
    const previous = mentions.filter(mention => mention.span.end <= span.start);
    const sentenceStart = Math.max(text.lastIndexOf('. ', span.start), text.lastIndexOf('\n', span.start)) + 1;
    const local = previous.filter(mention => mention.span.start >= sentenceStart);
    const pool = local.length ? local : previous.filter(mention => mention.span.start >= Math.max(0, sentenceStart - 220));
    const candidates = [...new Set(pool.flatMap(mention => mention.roleCandidates))];
    const taskIds = plan.tasks.filter(task => task.sourceSpans.some(source => source.start <= span.start && source.end >= span.end)).map(task => task.taskId);
    mentions.push({id: `${input.operationId}/mention-v4/${span.start}-${span.end}`, span, taskIds,
      modelCandidates: [...new Set(pool.flatMap(mention => mention.modelCandidates))], kind: 'anaphor', qualifier: 'anaphoric',
      roleCandidates: candidates, status: candidates.length === 1 ? 'proposed' : 'unresolved',
      basis: 'Same-sentence candidates preferred; otherwise bounded preceding context. Multiple discourse roles are unresolved.'});
  }
  const taskRoles = plan.tasks.map(task => {
    const scalarReturn = task.behavioralAction.kind === 'return' && /\breturns?\s+(?:true|false|zero|\d+)\b/i.test(task.obligationText);
    const direct = scalarReturn ? [] : mentions.filter(mention => mention.taskIds.includes(task.taskId));
    let inherited: Mention4[] = [];
    if (task.sharedSubject && !scalarReturn) inherited = mentions.filter(mention => task.sharedSubject!.start <= mention.span.start && task.sharedSubject!.end >= mention.span.end);
    if (!direct.length && /^Both\b/i.test(task.obligationText)) {
      const prefix = text.slice(0, task.sourceSpans[0].start).trimEnd();
      const earlierBoundary = Math.max(prefix.lastIndexOf('. ', Math.max(0, prefix.length - 2)), prefix.lastIndexOf('\n', Math.max(0, prefix.length - 2)));
      const antecedents = mentions.filter(mention => mention.span.start > earlierBoundary && mention.span.end <= task.sourceSpans[0].start && mention.kind !== 'anaphor');
      if (antecedents.length === 2 && /\band\b/.test(prefix.slice(Math.max(0, earlierBoundary)))) inherited = antecedents;
    }
    // Reuse uniquely qualified subject in the same sentence when an ellipsis has no overt target.
    if (!scalarReturn && !direct.length && !inherited.length && /^(?:is|has|have|be|sets|records?|updates?|includes?|stores?|makes?|marks?|clears?)\b/i.test(task.obligationText)) {
      const sentence = task.contextSpans[0];
      const earlier = mentions.filter(mention => mention.span.start >= sentence.start && mention.span.end <= task.sourceSpans[0].start && mention.kind !== 'anaphor');
      const first = earlier[0];
      if (first) inherited = [first];
    }
    const evidence = [...new Map([...direct, ...inherited].map(mention => [mention.id, mention])).values()];
    const ids = [...new Set(evidence.flatMap(mention => mention.modelCandidates))];
    const mentionedParameters = parameterMentionsV4(task.obligationText, input.parameters, input.modelTypes);
    const parameters = context.index.operation.parameters.filter(parameter => mentionedParameters.includes(parameter.name));
    const attributes = context.index.entities.filter(entity => ids.includes(entity.id)).flatMap(entity => entity.features)
      .filter(feature => new RegExp(`\\b${escape4(words4(feature.name))}\\b`, 'i').test(words4(task.obligationText))).map(feature => feature.id);
    return {taskId: task.taskId, mentionIds: evidence.map(mention => mention.id),
      roleCandidates: [...new Set(evidence.flatMap(mention => mention.roleCandidates))], modelCandidates: ids,
      attributeCandidates: [...new Set(attributes)], parameterRefs: parameters.map(parameter => parameter.id),
      subjectInherited: inherited.length > 0, evidenceSpans: evidence.map(mention => mention.span),
      unresolved: scalarReturn ? false : !evidence.length || evidence.some(mention => mention.roleCandidates.length !== 1 || mention.status === 'unresolved')};
  });
  const body = {version: 'narrative-role-resolver-v4', planHash: plan.planHash, sourceHash: input.sourceHash,
    modelHash: ccHash(context.index), mentions: mentions.sort((a, b) => a.span.start - b.span.start), roles, taskRoles,
    semanticPolicy: 'Model candidates and textual discourse roles only. No AST/business identity proof, predicate or OCL answer.'};
  return {...body, hash: ccHash(body)};
}
export type Roles4 = ReturnType<typeof resolveNarrativeRolesV4>;
