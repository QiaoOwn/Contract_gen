import {assertConstraintTaskPlan, type ConstraintTaskPlan} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import {ccHash} from './crossClauseGraph';

export type RelationType = 'same-target' | 'guard-effect' | 'create-use' | 'same-quantity' | 'pre-post-state' | 'effect-result' | 'conditional-effect';
export type RoleMention = {id: string; taskId: string; entity: string; qualifier: string; surface: string; line: number; start: number; end: number};
export type SourceSpan = {line: number; start: number; end: number; exact: string};
export type ObligationRelation = {
  relationId: string; sourceTaskIds: string[]; targetTaskIds: string[]; relationType: RelationType;
  subjectRole: string | null; objectRole: string | null;
  sourceEvidence: {requirementLines: number[]; exactSpans: string[]; spans: SourceSpan[]};
  modelCandidates: string[]; verificationStatus: 'grounded' | 'proposed' | 'unresolved';
  enforceability: 'deterministic' | 'advisory' | 'not-checkable'; rationale: string;
  semanticIdentityProven: false;
};
export type ObligationRelationPlan = {
  version: 'obligation-relation-plan-v1'; taskPlanHash: string; requirementHash: string; modelHash: string;
  intent: {text: string; spans: SourceSpan[]}; roles: RoleMention[]; relations: ObligationRelation[];
  parameters: {parameterId: string; taskIds: string[]; exactName: string; basis: string}[]; hash: string;
  intentCues: {text: string; spans: SourceSpan[]; modelCandidates: string[]; parameterCandidates: string[]; status: 'proposed'; basis: string}[];
};
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const containsWord = (text: string, word: string) => new RegExp(`\\b${escaped(word)}\\b`, 'i').test(text);
const effect = /\b(creat\w*|link\w*|record\w*|stored|becom\w*|decreas\w*|increas\w*|updat\w*|remov\w*|delet\w*|chang\w*|set|sets|deduct\w*)\b/i;

// Lexical patterns expose sourced roles and candidate relations, not an NL entailment engine.
export function compileObligationRelations(plan: ConstraintTaskPlan, context: OperationModelGrounding, requirement: string): ObligationRelationPlan {
  assertConstraintTaskPlan(plan, context, requirement);
  const lines = requirement.split(/\r?\n/);
  const taskSpan = (id: string): SourceSpan => {
    const task = plan.tasks.find(task => task.id === id)!;
    const start = lines[task.requirementLine - 1].indexOf(task.requirement);
    if (start < 0) throw new Error('Task source span missing');
    return {line: task.requirementLine, start, end: start + task.requirement.length, exact: task.requirement};
  };
  const roles: RoleMention[] = [];
  for (const task of plan.tasks) for (const entity of context.index.entities) {
    // Require the literal model spelling; lower-case compound "sale line" is not a Sale mention.
    const regex = new RegExp(`\\b${escaped(entity.name)}\\b`, 'g');
    for (const match of task.requirement.matchAll(regex)) {
      const offset = match.index!;
      const prefix = task.requirement.slice(0, offset);
      const modifier = /\b(current|referenced|scanned|selected|target|source|destination|other|another|neighbor|previous|first|second|new|old|created)\s+$/i.exec(prefix);
      const qualifier = modifier?.[1].toLowerCase() ?? 'unspecified';
      const start = offset - (modifier ? modifier[0].length : 0);
      const source = taskSpan(task.id), surface = task.requirement.slice(start, offset + match[0].length);
      roles.push({id: `${task.id}/role/${roles.filter(role => role.taskId === task.id).length + 1}`, taskId: task.id,
        entity: entity.name, qualifier, surface, line: source.line, start: source.start + start, end: source.start + offset + match[0].length});
    }
  }
  const relations: ObligationRelation[] = [];
  const add = (type: RelationType, from: string[], to: string[], subject: string | null, object: string | null,
    status: ObligationRelation['verificationStatus'], rationale: string, candidates: string[] = []) => {
    const spans = [...new Set([...from, ...to])].map(taskSpan);
    const payload = {sourceTaskIds: from, targetTaskIds: to, relationType: type, subjectRole: subject, objectRole: object,
      sourceEvidence: {requirementLines: spans.map(span => span.line), exactSpans: spans.map(span => span.exact), spans},
      modelCandidates: [...new Set(candidates)].sort(), verificationStatus: status,
      enforceability: status === 'unresolved' ? 'not-checkable' as const : 'advisory' as const,
      rationale, semanticIdentityProven: false as const};
    const relationId = `${plan.operationId}/R/${ccHash({type, from, to, subject, object}).slice(0, 16)}`;
    if (!relations.some(relation => relation.relationId === relationId)) relations.push({relationId, ...payload});
  };
  for (let i = 0; i < roles.length; i++) for (let j = i + 1; j < roles.length; j++) {
    const a = roles[i], b = roles[j];
    if (a.taskId === b.taskId || a.entity !== b.entity) continue;
    if (a.qualifier !== 'unspecified' && b.qualifier !== 'unspecified' && a.qualifier !== b.qualifier) continue;
    const entityId = context.index.entities.find(entity => entity.name === a.entity)!.id;
    const repeated = a.qualifier !== 'unspecified' && a.qualifier === b.qualifier &&
      roles.filter(role => role.taskId === a.taskId && role.entity === a.entity && role.qualifier === a.qualifier).length === 1 &&
      roles.filter(role => role.taskId === b.taskId && role.entity === b.entity && role.qualifier === b.qualifier).length === 1;
    add('same-target', [a.taskId], [b.taskId], a.id, b.id, repeated ? 'grounded' : 'proposed', repeated
      ? 'The same explicitly qualified noun phrase recurs in both source obligations; grounded is textual evidence only, not proved AST/business identity.'
      : 'Compatible named class mentions suggest a target relation; same type or bare noun is not proof of object identity.', [entityId]);
    const source = plan.tasks.find(task => task.id === a.taskId)!, target = plan.tasks.find(task => task.id === b.taskId)!;
    if (source.clause === 'precondition' && target.clause === 'postcondition' && effect.test(target.requirement))
      add('guard-effect', [a.taskId], [b.taskId], a.id, b.id, 'proposed', 'Sourced precondition and explicit effect mention compatible roles; actual guarded/effected object correspondence remains to be solved.', [entityId]);
  }
  for (const entity of context.index.entities) {
    const creationTasks = plan.tasks.filter(task => task.clause === 'postcondition' && containsWord(task.requirement, entity.name) && /\bcreat\w*\b/i.test(task.requirement) &&
      !/\b(not|never|without)\s+(?:\w+\s+){0,2}creat/i.test(task.requirement));
    const uses = roles.filter(role => role.entity === entity.name && role.qualifier === 'new');
    for (const use of uses) {
      const creators = creationTasks.filter(task => task.id !== use.taskId);
      if (!creators.length) continue;
      const unique = creators.length === 1 && roles.filter(role => role.taskId === creators[0].id && role.entity === entity.name).length === 1;
      add('create-use', creators.map(task => task.id), [use.taskId], unique ? roles.find(role => role.taskId === creators[0].id && role.entity === entity.name)!.id : null,
        use.id, unique ? 'grounded' : 'unresolved', unique
          ? 'One explicit creation of this class precedes an explicit new-object mention; textual antecedent link only, no precomputed OCL object.'
          : 'Multiple possible creation antecedents; no unique object identity is established.', [entity.id]);
    }
  }
  const parameters: ObligationRelationPlan['parameters'] = [];
  for (const parameter of context.index.operation.parameters) {
    const tasks = plan.tasks.filter(task => containsWord(task.requirement, parameter.name));
    if (!tasks.length) continue;
    parameters.push({parameterId: parameter.id, taskIds: tasks.map(task => task.id), exactName: parameter.name,
      basis: 'Exact whole-word formal-parameter occurrence in frozen NL, not attribute-name matching'});
    if (tasks.length > 1) add('same-quantity', [tasks[0].id], tasks.slice(1).map(task => task.id), parameter.id, parameter.id, 'grounded',
      'The same formal parameter name occurs across these obligations. Its declared identity/type is checkable; correct use of its value remains advisory.', [parameter.id]);
  }
  for (const task of plan.tasks) if (task.clause === 'postcondition') {
    if (/\b(decreas\w*|increas\w*|deduct\w*|before|after|remaining|stock)\b/i.test(task.requirement) && effect.test(task.requirement)) {
      const owners = roles.filter(role => role.taskId === task.id).map(role => role.entity);
      const candidates = context.index.entities.filter(entity => owners.includes(entity.name)).flatMap(entity => entity.features.filter(feature =>
        feature.kind === 'attribute' && /amount|stock|balance|quantity|count|number/i.test(feature.name)).map(feature => feature.id));
      add('pre-post-state', [task.id], [task.id], roles.find(role => role.taskId === task.id)?.id ?? null, null, 'grounded',
        'An explicit change verb supplies before/after intent. Numeric model properties are candidates, not a selected update equation; @pre alone cannot prove this obligation.', candidates);
    }
    if (/\b(if|when|unless|otherwise|provided)\b/i.test(task.requirement)) add('conditional-effect', [task.id], [task.id], null, null,
      'proposed', 'The source contains a condition marker. Branch meaning and effects require interpretation; no additional branch behavior is inferred.');
  }
  const results = plan.tasks.filter(task => task.clause === 'postcondition' && /\breturn\w*\b/i.test(task.requirement));
  for (const result of results) for (const task of plan.tasks.filter(task => task.clause === 'postcondition' && task.id !== result.id && effect.test(task.requirement))) {
    const explicit = /\b(if|when|upon|after|successful|success)\b/i.test(result.requirement);
    add('effect-result', [task.id], [result.id], null, context.index.operation.returnType?.id ?? null, explicit ? 'proposed' : 'unresolved', explicit
      ? 'The return obligation has a coupling marker, but which effect it depends on is not yet proved.'
      : 'These are distinct sourced postconditions; task order alone does not establish return iff effect success.', context.index.operation.returnType ? [context.index.operation.returnType.id] : []);
  }
  const intentSpans: SourceSpan[] = [];
  let inIntent = false;
  lines.forEach((line, i) => {if (line.trim() === 'Operation intent:') {inIntent = true; return;} if (line.trim() === 'Preconditions:') inIntent = false;
    if (inIntent && line.trim()) intentSpans.push({line: i + 1, start: 0, end: line.length, exact: line});});
  const intentCues: ObligationRelationPlan['intentCues'] = [];
  for (const span of intentSpans) for (const match of span.exact.matchAll(/\b(supplied|provided|given)\s+(identifier|id)\b/gi)) {
    const owners = context.index.entities.filter(entity => containsWord(plan.intent, entity.name));
    intentCues.push({text: match[0], spans: [{line: span.line, start: match.index!, end: match.index! + match[0].length, exact: match[0]}],
      modelCandidates: owners.flatMap(entity => entity.features.filter(feature => /(?:^id$|id$|identifier)/i.test(feature.name)).map(feature => feature.id)),
      parameterCandidates: context.index.operation.parameters.filter(parameter => /(?:^id$|id$|identifier)/i.test(parameter.name)).map(parameter => parameter.id),
      status: 'proposed', basis: 'Explicit intent selection phrase plus transparent identifier/name recall; not a verified Id=parameter predicate'});
  }
  const payload = {version: 'obligation-relation-plan-v1' as const, taskPlanHash: plan.hash, requirementHash: plan.requirementHash,
    modelHash: ccHash(context.index), intent: {text: plan.intent, spans: intentSpans}, roles, relations, parameters, intentCues};
  return {...payload, hash: ccHash(payload)};
}

export function auditObligationRelationSources(plan: ConstraintTaskPlan, context: OperationModelGrounding, requirement: string, R: ObligationRelationPlan) {
  const compiled = compileObligationRelations(plan, context, requirement);
  if (ccHash(compiled) !== ccHash(R)) throw new Error('Relation plan differs from immutable source compilation');
  const lines = requirement.split(/\r?\n/);
  const declarationIds = new Set(plan.declarations.map(declaration => declaration.id));
  for (const relation of R.relations) {
    for (const span of relation.sourceEvidence.spans) if (lines[span.line - 1].slice(span.start, span.end) !== span.exact) throw new Error('Relation source span mismatch');
    if (relation.enforceability === 'deterministic') throw new Error('No business relation in this compiler is a hard semantic checker');
    if (!relation.modelCandidates.every(id => declarationIds.has(id))) throw new Error('Unknown model declaration in relation');
  }
  for (const cue of R.intentCues) for (const span of cue.spans) if (lines[span.line - 1].slice(span.start, span.end) !== span.exact) throw new Error('Intent source span mismatch');
  if (!R.parameters.every(role => context.index.operation.parameters.some(parameter => parameter.id === role.parameterId))) throw new Error('Unknown parameter role');
  return {sourceIntegrity: true, taskPlanUnchanged: true, modelReferencesVerified: true, parameterDeclarationsVerified: true,
    businessIdentityProven: false, hardBusinessConstraints: 0};
}
