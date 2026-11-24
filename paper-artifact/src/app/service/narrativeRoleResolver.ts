import {ccHash} from './crossClauseGraph';
import {assertNarrativePlan, type NarrativeInput, type compileNarrativeObligations} from './narrativeObligationCompiler';

type Plan = ReturnType<typeof compileNarrativeObligations>;
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export type NarrativeMention = {
  id: string; taskId: string; start: number; end: number; text: string;
  qualifier: string | null; modelCandidates: string[];
  kind: 'named-type' | 'anaphor' | 'alias'; antecedentCandidates: string[];
  status: 'grounded' | 'proposed' | 'unresolved';
  businessIdentityProven: false;
};

/** Names and anaphors are evidence-bearing candidates, never instance equality proofs. */
export function resolveNarrativeRoles(input: NarrativeInput, plan: Plan) {
  assertNarrativePlan(input, plan);
  const mentions: NarrativeMention[] = [];
  for (const task of plan.tasks) {
    for (const span of task.sourceSpans) {
      const hits: {start: number; end: number; text: string; type: string; qualifier: string | null}[] = [];
      for (const type of input.modelTypes) {
        const words = type.replace(/([a-z])([A-Z])/g, '$1 $2');
        const pattern = new RegExp(`\\b(?:(new|current|referenced|other|another|previous|target)\\s+)?(${escape(type)}|${escape(words)})\\b`, 'gi');
        for (const match of span.exactText.matchAll(pattern)) hits.push({start: span.start + match.index!,
          end: span.start + match.index! + match[0].length, text: match[0], type, qualifier: match[1]?.toLowerCase() ?? null});
      }
      for (const hit of hits.sort((a, b) => a.start - b.start || b.end - a.end)) {
        if (mentions.some(mention => mention.start <= hit.start && mention.end >= hit.end)) continue;
        mentions.push({id: `${task.taskId}/mention/${hit.start}`, taskId: task.taskId, ...hit,
          modelCandidates: [hit.type], kind: 'named-type', antecedentCandidates: [], status: 'grounded', businessIdentityProven: false});
      }
      const aliases = new Map<string, string[]>();
      for (const type of input.modelTypes) {
        const words = type.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
        if (words.length < 2) continue;
        for (const alias of [words.at(-1)!, ...(words.length > 2 ? [words.slice(0, -1).join(' '), words.at(-2)!] : [])]) {
          aliases.set(alias, [...(aliases.get(alias) ?? []), type]);
        }
      }
      for (const [alias, types] of aliases) for (const match of span.exactText.matchAll(new RegExp(`\\b(?:the|this|that|new|current)\\s+${escape(alias)}\\b`, 'gi'))) {
        const start = span.start + match.index!, end = start + match[0].length;
        if (mentions.some(mention => mention.start < end && mention.end > start)) continue;
        const prior = mentions.filter(mention => mention.end <= start && mention.modelCandidates.some(type => types.includes(type)));
        mentions.push({id: `${task.taskId}/mention/${start}`, taskId: task.taskId, start, end, text: match[0],
          qualifier: null, modelCandidates: [...new Set(types)], kind: 'alias', antecedentCandidates: prior.map(mention => mention.id),
          status: prior.length === 1 && types.length === 1 ? 'proposed' : 'unresolved', businessIdentityProven: false});
      }
      for (const match of span.exactText.matchAll(/\b(?:it|that object|this object|the object)\b/gi)) {
        const start = span.start + match.index!;
        // Sentence-initial It + action usually denotes the system, not a business object.
        const agent = /^it$/i.test(match[0]) && /^\s+(?:creates?|returns?|stores?|sets?|adds?|updates?|deletes?)\b/i.test(input.narrativeRequirement.slice(start + match[0].length));
        if (agent) continue;
        const candidates = mentions.filter(mention => mention.kind === 'named-type' && mention.end <= start);
        mentions.push({id: `${task.taskId}/mention/${start}`, taskId: task.taskId, start, end: start + match[0].length,
          text: match[0], qualifier: null, kind: 'anaphor', modelCandidates: [...new Set(candidates.flatMap(candidate => candidate.modelCandidates))],
          antecedentCandidates: candidates.map(candidate => candidate.id), status: candidates.length === 1 ? 'proposed' : 'unresolved', businessIdentityProven: false});
      }
    }
  }
  const relations = mentions.filter(mention => mention.kind !== 'named-type').map(mention => ({
    id: `${mention.id}/relation`, type: 'same-target' as const, targetMention: mention.id,
    sourceMentions: mention.antecedentCandidates, status: mention.status,
    enforceability: 'advisory/not-checkable' as const, evidence: {start: mention.start, end: mention.end},
  }));
  const body = {version: 'narrative-role-resolution-v1', planHash: plan.planHash, sourceHash: input.sourceHash,
    mentions, relations, modelSelectionPolicy: 'Full model fallback for unresolved roles; same type never proves object identity.'};
  return {...body, hash: ccHash(body)};
}
