import {ccHash} from './crossClauseGraph';
import type {compileNarrativeRelations} from './narrativeRelations';

/** Input-quality audit only: preserve the complete raw graph for independent inspection. */
export function reviewNarrativeRelations(raw: ReturnType<typeof compileNarrativeRelations>) {
  const seen = new Set<string>();
  const decisions = raw.relations.map(relation => {
    const key = ccHash({type: relation.type, from: [...relation.from].sort(), to: [...relation.to].sort()});
    let action: 'retain-advisory' | 'audit-only' = 'retain-advisory';
    let reason = 'Sourced candidate adds an explicit relation between obligations; no identity proof.';
    const targetMentions = raw.roles.mentions.filter(mention => relation.to.includes(mention.taskId) && mention.kind === 'named-type');
    const uniqueDemonstrative = relation.type === 'same-target' && relation.from.length === 1 && relation.to.length === 1 &&
      targetMentions.length === 1 && relation.sourceSpans.some(span => /\bthat\s+[A-Z]\w*\b/.test(span.exactText)) &&
      raw.roles.mentions.filter(mention => mention.kind === 'named-type' && mention.end <= targetMentions[0].start &&
        mention.modelCandidates.some(type => targetMentions[0].modelCandidates.includes(type))).length === 1;
    if (seen.has(key)) {action = 'audit-only'; reason = 'Duplicate task-pair/type relation.';}
    else if (!relation.sourceSpans.length) {action = 'audit-only'; reason = 'No source span.';}
    else if (relation.type === 'same-target' && /Compatible named class mentions/.test(relation.reason) && !uniqueDemonstrative) {
      action = 'audit-only'; reason = 'Same-type lexical co-occurrence alone adds no supported instance relation.';
    } else if (relation.type === 'guard-effect' && /Sourced precondition and explicit effect mention compatible roles/.test(relation.reason)) {
      action = 'audit-only'; reason = 'Class-compatible pre/effect mentions alone do not establish the guarded business target; preserve as low-evidence audit candidate.';
    } else if (relation.status === 'unresolved' && relation.from.length > 1) {
      action = 'audit-only'; reason = 'Multiple antecedents: retain alternatives in unresolved audit, not a same-object assertion.';
    } else if (relation.type === 'effect-result' && relation.status === 'unresolved') {
      action = 'audit-only'; reason = 'Independent effect and return tasks do not establish a causal/iff relation.';
    } else if (relation.from.length === 1 && relation.to.length === 1 && relation.from[0] === relation.to[0]) {
      action = 'audit-only'; reason = 'Local state/condition cue is already visible in Tn; not extra cross-obligation information.';
    }
    if (uniqueDemonstrative && action === 'retain-advisory') reason = 'Explicit demonstrative with one prior compatible named mention; sourced anaphoric candidate, not AST or business identity proof.';
    seen.add(key);
    return {relationId: relation.id, action, reason};
  });
  const keep = new Set(decisions.filter(decision => decision.action === 'retain-advisory').map(decision => decision.relationId));
  const retained = raw.relations.filter(relation => keep.has(relation.id));
  const body = {version: 'narrative-relation-input-review-v1', rawHash: raw.hash, decisions, retained,
    unresolved: raw.relations.filter(relation => relation.status === 'unresolved'),
    policy: 'All retained business relations remain advisory. AST binding/semantic identity requires candidate/independent evidence.'};
  return {...body, hash: ccHash(body)};
}
