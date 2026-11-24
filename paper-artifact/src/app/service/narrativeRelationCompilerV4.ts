import {ccHash} from './crossClauseGraph';
import type {NarrativeInput} from './narrativeObligationCompiler';
import {assertNarrativePlanV4, type Plan4} from './narrativeObligationCompilerV4';
import type {Roles4} from './narrativeRoleResolverV4';
import type {RelationType} from './obligationRelationCompiler';
import type {Span4} from './narrativeV4Syntax';

export type Relation4 = {id: string; type: RelationType; from: string[]; to: string[]; sourceSpans: Span4[];
  roleEvidence: string[]; modelCandidates: string[]; status: 'grounded' | 'proposed' | 'unresolved';
  enforceability: 'advisory' | 'not-checkable'; basis: string; semanticIdentityProven: false};
export function compileNarrativeRelationsV4(input: NarrativeInput, plan: Plan4, roles: Roles4,
  validatePlan: typeof assertNarrativePlanV4 = assertNarrativePlanV4) {
  validatePlan(input, plan);
  if (roles.planHash !== plan.planHash) throw new Error('Roles belong to another Tn');
  const raw: Relation4[] = [], duplicates: string[] = [];
  const add = (type: RelationType, from: string[], to: string[], evidence: string[], status: Relation4['status'], basis: string) => {
    const ids = [...new Set([...from, ...to])];
    const sourceSpans = ids.flatMap(id => {const task = plan.tasks.find(task => task.taskId === id)!; return [...task.sourceSpans, ...task.conditionScope.evidence];});
    const uniqueSpans = [...new Map(sourceSpans.map(span => [`${span.start}:${span.end}`, span])).values()];
    const key = ccHash({type, from: [...from].sort(), to: [...to].sort(), evidence: [...evidence].sort()});
    if (raw.some(relation => relation.id.endsWith(key.slice(0, 16)))) {duplicates.push(key); return;}
    const modelCandidates = [...new Set(ids.flatMap(id => roles.taskRoles.find(task => task.taskId === id)?.modelCandidates ?? []))];
    raw.push({id: `${input.operationId}/R-v4/${key.slice(0, 16)}`, type, from, to, sourceSpans: uniqueSpans,
      roleEvidence: evidence, modelCandidates, status, enforceability: status === 'unresolved' ? 'not-checkable' : 'advisory',
      basis, semanticIdentityProven: false});
  };
  for (let i = 0; i < plan.tasks.length; i++) for (let j = i + 1; j < plan.tasks.length; j++) {
    const a = plan.tasks[i], b = plan.tasks[j];
    const ar = roles.taskRoles.find(row => row.taskId === a.taskId)!, br = roles.taskRoles.find(row => row.taskId === b.taskId)!;
    const shared = ar.roleCandidates.filter(id => br.roleCandidates.includes(id));
    const commonTypes = ar.modelCandidates.filter(id => br.modelCandidates.includes(id));
    if (!shared.length && !commonTypes.length) continue;
    const aMentions = roles.mentions.filter(mention => ar.mentionIds.includes(mention.id));
    const bMentions = roles.mentions.filter(mention => br.mentionIds.includes(mention.id));
    const sameSentenceSubject = a.contextSpans[0]?.start === b.contextSpans[0]?.start &&
      (ar.subjectInherited || br.subjectInherited || a.sharedSubject || b.sharedSubject);
    const linkedRoles = shared.filter(role => sameSentenceSubject || bMentions.some(mention =>
      mention.roleCandidates.length === 1 && mention.roleCandidates.includes(role) &&
      ['the', 'that', 'this', 'new', 'current', 'referenced', 'requested', 'scanned', 'matching', 'selected', 'corresponding', 'anaphoric'].includes(mention.qualifier)) ||
      aMentions.some(mention => mention.kind === 'anaphor' && mention.roleCandidates.length === 1 && mention.roleCandidates.includes(role)));
    const hasTextualBridge = linkedRoles.length > 0;
    add('same-target', [a.taskId], [b.taskId], shared,
      hasTextualBridge ? 'proposed' : 'unresolved', hasTextualBridge ? 'Unique shared sourced discourse role with definite/qualified/anaphoric or inherited-subject bridge' : 'Model-type co-occurrence only, without a unique textual bridge');
    const pre = a.category === 'precondition' ? a : b.category === 'precondition' ? b : null;
    const post = a.category === 'postcondition' ? a : b.category === 'postcondition' ? b : null;
    if (pre && post && pre !== post) add('guard-effect', [pre.taskId], [post.taskId], shared,
      hasTextualBridge ? 'proposed' : 'unresolved', hasTextualBridge ? 'Explicit P/Q categories and unique text-linked role; guarded/effected identity remains advisory' : 'Category/type match is not sufficient to identify guarded/effected object');
    const creation = a.behavioralAction.kind === 'create' ? a : null;
    const createdRoles = shared.filter(id => roles.roles.find(role => role.id === id)?.qualifier === 'new');
    if (creation && b.category === 'postcondition' && hasTextualBridge && createdRoles.length === 1) add('create-use', [creation.taskId], [b.taskId], createdRoles, 'proposed',
      'Creation followed by a sourced reference to its unique discourse-role candidate; no OCL object chosen');
    const parameters = a.referencedParameters.filter(name => b.referencedParameters.includes(name));
    if (parameters.length) add('same-quantity', [a.taskId], [b.taskId], parameters.map(name => `parameter:${name}`), 'grounded',
      'Exact formal parameter name shared by source obligations; attribute spelling does not establish parameter binding');
    if (hasTextualBridge && a.behavioralAction.kind !== 'return' && b.behavioralAction.kind !== 'return' && (a.behavioralAction.kind === 'update' || b.behavioralAction.kind === 'update'))
      add('pre-post-state', [a.taskId], [b.taskId], shared, 'proposed', 'Sourced shared role and update cue; temporal equation and update correctness are not computed');
    if (b.behavioralAction.kind === 'return' && a.behavioralAction.kind !== 'return' && a.category === 'postcondition') add('effect-result', [a.taskId], [b.taskId], shared,
      hasTextualBridge && /\b(?:that|same|it|new)\b/i.test(b.obligationText) ? 'proposed' : 'unresolved',
      'Return target linkage needs explicit role/return source; task ordering alone does not prove causality');
  }
  // Parameter-only relations also apply when clauses have no resolvable object role.
  for (const parameter of input.parameters) {
    const uses = plan.tasks.filter(task => task.referencedParameters.includes(parameter));
    for (let i = 1; i < uses.length; i++) add('same-quantity', [uses[0].taskId], [uses[i].taskId], [`parameter:${parameter}`], 'grounded', 'Exact source parameter reference');
  }
  const scopeSeen = new Set<string>();
  for (const task of plan.tasks.filter(task => ['branch', 'trigger'].includes(task.conditionScope.kind))) {
    const scopeKey = ccHash(task.conditionScope);
    if (scopeSeen.has(scopeKey)) continue;
    scopeSeen.add(scopeKey);
    const peers = plan.tasks.filter(peer => peer.taskId !== task.taskId && peer.conditionScope.evidence.some(a => task.conditionScope.evidence.some(b => a.start === b.start && a.end === b.end)));
    if (peers.length) add('conditional-effect', [task.taskId], peers.map(peer => peer.taskId), [], 'proposed', 'Effects share the exact condition/trigger span; not a global guard');
    else add('conditional-effect', [task.taskId], [task.taskId], [], 'grounded', 'Local branch scope already present in Tn');
  }
  const connected = new Map<string, Map<string, string>>();
  const find = (role: string, task: string): string => {
    if (!connected.has(role)) connected.set(role, new Map());
    const parent = connected.get(role)!;
    if (!parent.has(task)) parent.set(task, task);
    const value = parent.get(task)!;
    if (value !== task) parent.set(task, find(role, value));
    return parent.get(task)!;
  };
  const decisions = raw.map(relation => {
    const crossTask = [...new Set([...relation.from, ...relation.to])].length > 1;
    let keep = crossTask && relation.status !== 'unresolved' && relation.sourceSpans.length > 0;
    let reason = !crossTask ? 'Local scope cue already in Tn' : relation.status === 'unresolved' ? 'Insufficient unique textual/role evidence' : 'Independent tasks linked by explicit source evidence';
    if (keep && relation.type === 'same-target') {
      const specific = raw.some(other => ['create-use', 'guard-effect'].includes(other.type) && other.status !== 'unresolved' &&
        ccHash([...other.from, ...other.to].sort()) === ccHash([...relation.from, ...relation.to].sort()) &&
        other.roleEvidence.some(id => relation.roleEvidence.includes(id)));
      if (specific) {keep = false; reason = 'Same source-role task pair is already represented by a more specific creation/guard relation';}
      else if (relation.roleEvidence.length === 1 && relation.from.length === 1 && relation.to.length === 1) {
        const role = relation.roleEvidence[0], a = find(role, relation.from[0]), b = find(role, relation.to[0]);
        if (a === b) {keep = false; reason = 'Redundant edge in the same text-role connected component; sourced spanning links retained';}
        else connected.get(role)!.set(a, b);
      }
    }
    return {relationId: relation.id, action: keep ? 'generation-advisory' : 'audit-only',
      reason};
  });
  const allowed = new Set(decisions.filter(decision => decision.action === 'generation-advisory').map(decision => decision.relationId));
  const generation = raw.filter(relation => allowed.has(relation.id));
  const body = {version: 'narrative-relation-compiler-v4', planHash: plan.planHash, rolesHash: roles.hash, sourceHash: input.sourceHash,
    raw, reviewed: decisions, generation, duplicateSuppression: duplicates, hardBusinessConstraints: 0};
  return {...body, hash: ccHash(body)};
}
export type Relations4 = ReturnType<typeof compileNarrativeRelationsV4>;
