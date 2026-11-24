export type Span4 = {start: number; end: number; exactText: string};
export type Frame4 = {span: Span4; sentence: Span4; context: Span4[];
  scope: {kind: 'global' | 'eligibility' | 'branch' | 'trigger' | 'temporal' | 'unknown'; evidence: Span4[]; polarity: 'positive' | 'negative' | 'unspecified'};
  inheritedSubject: Span4 | null; force: 'precondition' | 'postcondition' | 'unresolved' | null; rule: string};
export const action4 = /\b(?:creat(?:e|es|ed|ing)|register(?:s|ing)?|add(?:s|ed|ing)?|record(?:s|ed|ing)?|includ(?:e|es|ed|ing)|return(?:s|ed|ing)?|remov(?:e|es|ed|ing)|delet(?:e|es|ed|ing)|updat(?:e|es|ed|ing)|set(?:s)?|chang(?:e|es|ed|ing)|increas(?:e|es|ed|ing)|decreas(?:e|es|ed|ing)|reduc(?:e|es|ed|ing)|deduct(?:s|ed|ing)?|associat(?:e|es|ed|ing)|link(?:s|ed|ing)?|store(?:s|d)?|clear(?:s|ed)?|reset(?:s)?|mark(?:s|ed)?|make(?:s)?|becom(?:e|es)|assign(?:s|ed)?|attach(?:es|ed)?|close(?:s|d)?|timestamp(?:s|ed)?|increment(?:s)?|extend(?:s|ed)?|send(?:s)?|receiv(?:e|es)|succeeds?|select(?:s)?|accept(?:s)?|reject(?:s)?)\b/i;
export const guard4 = /\b(?:must|shall|requires?|required|provided|only if|only when|no existing)\b/i;
const predicate4 = /\b(?:must|shall|requires?|exists?|has|have|is|are|returns?|creates?|records?|associates?|links?|updates?|sets|includes?|stores?|becomes?|increases?|decreases?|reduces?|clears?|resets?|marks?|makes?|adds?|closes?|timestamps?|increments?|removes?|changes?|assigns?|attaches?|extends?|receives?)\b/i;
const firstPredicate4 = (text: string) => [...text.matchAll(new RegExp(predicate4.source, 'gi'))].find(match =>
  !( /^stores?$/i.test(match[0]) && /^(?:the|a|an|current|new|selected|referenced|requested)(?:\s+(?:current|new|selected|referenced|requested))?\s+$/i.test(text.slice(0, match.index!)) ));
export function sourceSpan4(text: string, start: number, end: number): Span4 {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return {start, end, exactText: text.slice(start, end)};
}

/** Surface scope analysis: every decision preserves its source; no business equations are synthesized. */
export function frames4(text: string): Frame4[] {
  const result: Frame4[] = [];
  for (const match of text.matchAll(/[\s\S]+?(?:[.!?;](?=\s|$)|$)/g)) {
    if (!match[0].trim()) continue;
    const sentence = sourceSpan4(text, match.index!, match.index! + match[0].length);
    const value = sentence.exactText;
    const add = (start: number, end: number, force: Frame4['force'], scope: Frame4['scope'], rule: string, shared: Span4 | null = null) => {
      const span = sourceSpan4(text, start, end);
      if (!span.exactText) return;
      const branchCuts = force === 'postcondition' && ['branch', 'trigger'].includes(scope.kind)
        ? [...span.exactText.matchAll(/(?:,\s+|\s+and\s+)(?=(?:returns?|marks?|makes?|sets|clears?|records?|creates?|associates?|links?|updates?|adds?|closes?)\b|(?:the|its|that)\s+[^,.;]{1,60}\s+(?:returns?|is|are|becomes?|remains?)\b)/gi)] : [];
      const first = firstPredicate4(span.exactText);
      const subject = first && first.index > 0 ? sourceSpan4(text, span.start, span.start + first.index) : shared;
      let cursor = 0;
      for (const boundary of [...branchCuts.map(match => ({index: match.index!, length: match[0].length})), {index: span.exactText.length, length: 0}]) {
        const part = sourceSpan4(text, span.start + cursor, span.start + boundary.index);
        if (part.exactText) result.push({span: part, sentence, context: [sentence], scope,
          inheritedSubject: cursor ? subject : shared, force, rule: branchCuts.length ? 'scoped-effect-coordination' : rule});
        cursor = boundary.index + boundary.length;
      }
    };
    const global: Frame4['scope'] = {kind: 'global', evidence: [], polarity: 'unspecified'};
    const scoped = (kind: Frame4['scope']['kind'], span: Span4): Frame4['scope'] => ({kind, evidence: [span], polarity: /\bnot|no |unless/i.test(span.exactText) ? 'negative' : 'positive'});
    const relative = /\bwhose\s+/i.exec(value);
    if (relative && /\b(?:ends?|eject(?:s|ing)?)\b/i.test(value.slice(0, relative.index)) && !/\bcreat\w*\b/i.test(value)) {
      add(sentence.start, sentence.start + relative.index, 'postcondition', global, 'existing-session-end-effect');
      let cursor = relative.index;
      for (const boundary of [...value.matchAll(/\s+and\s+(?=whose\b)/gi)].map(match => ({start: match.index!, end: match.index! + match[0].length})).filter(item => item.start > cursor).concat([{start: value.length, end: value.length}])) {
        const guard = sourceSpan4(text, sentence.start + cursor, sentence.start + boundary.start);
        add(guard.start, guard.end, 'precondition', scoped('eligibility', guard), 'relative-session-eligibility'); cursor = boundary.end;
      }
      continue;
    }
    const startWhen = /\bwhen\s+/i.exec(value);
    if (startWhen && /\bstarts?\b.*\bat an? existing\b/i.test(value.slice(0, startWhen.index))) {
      add(sentence.start, sentence.start + startWhen.index, 'postcondition', global, 'start-existing-context-effect');
      const guard = sourceSpan4(text, sentence.start + startWhen.index, sentence.end);
      add(guard.start, guard.end, 'precondition', scoped('eligibility', guard), 'start-existing-context-eligibility');
      const existing = /\ban? existing\b[^,.;]*$/i.exec(value.slice(0, startWhen.index));
      if (existing) add(sentence.start + existing.index, sentence.start + startWhen.index, 'precondition', scoped('eligibility', sourceSpan4(text, sentence.start + existing.index, sentence.start + startWhen.index)), 'explicit-eligibility-modifier');
      continue;
    }
    const eligibility = /\b(?:provided(?: that)?|only (?:if|when))\s+/i.exec(value);
    const requirement = /\brequires?\s+|\bwith existence of\b/i.exec(value);
    if (eligibility && eligibility.index === 0 && value.includes(',')) {
      const comma = value.indexOf(',');
      const source = sourceSpan4(text, sentence.start, sentence.start + comma);
      add(sentence.start, sentence.start + comma, 'precondition', scoped('eligibility', source), 'leading-eligibility-clause');
      add(sentence.start + comma + 1, sentence.end, action4.test(value.slice(comma + 1)) ? 'postcondition' : 'unresolved', global, 'leading-eligibility-main-effect');
      continue;
    }
    if (eligibility && eligibility.index > 0) {
      const guardStart = sentence.start + eligibility.index;
      const tail = value.slice(eligibility.index + eligibility[0].length);
      const guardEnd = /,\s+and\s+(?:returns?|the operation returns?)\b/i.exec(tail);
      const end = guardEnd ? guardStart + eligibility[0].length + guardEnd.index : sentence.end;
      add(sentence.start, guardStart, action4.test(value.slice(0, eligibility.index)) ? 'postcondition' : 'unresolved', global, 'eligibility-main-clause');
      add(guardStart, end, 'precondition', scoped('eligibility', sourceSpan4(text, guardStart, end)), 'explicit-eligibility-clause');
      if (guardEnd) add(end + guardEnd[0].indexOf('and') + 3, sentence.end, 'postcondition', global, 'return-outside-eligibility');
      continue;
    }
    const branch = /^(?:if|when|unless)\b/i.exec(value);
    const otherwise = /\b(?:otherwise|else)\s*[,;:]?\s*/i.exec(value);
    if (branch) {
      const comma = value.indexOf(',');
      if (comma < 0) {add(sentence.start, sentence.end, 'unresolved', scoped('unknown', sentence), 'unscoped-condition'); continue;}
      const guard = sourceSpan4(text, sentence.start, sentence.start + comma);
      const remainder = value.slice(comma + 1);
      const isTrigger = /^when\b/i.test(value) && /\b(?:user|customer|cashier)\b.*\b(?:enters?|clicks?|requests?|scans?)\b/i.test(guard.exactText);
      const kind = isTrigger ? 'trigger' : 'branch';
      add(sentence.start + comma + 1, otherwise ? sentence.start + otherwise.index : sentence.end,
        action4.test(remainder) || /\b(?:is|are) (?:marked|cleared|closed|false|true)|\bremains?\b/i.test(remainder) ? 'postcondition' : 'unresolved', scoped(kind, guard), 'conditional-effect-body');
      if (otherwise) add(sentence.start + otherwise.index + otherwise[0].length, sentence.end, 'postcondition',
        {kind: 'branch', evidence: [guard, sourceSpan4(text, sentence.start + otherwise.index, sentence.start + otherwise.index + otherwise[0].length)], polarity: 'negative'}, 'else-body');
      continue;
    }
    if (/^otherwise\b/i.test(value)) {
      const previous = [...result].reverse().find(frame => frame.scope.kind === 'branch' &&
        !text.slice(frame.sentence.end, sentence.start).trim());
      add(sentence.start, sentence.end, previous && (action4.test(value) || /\b(?:is|remains?)\b/i.test(value)) ? 'postcondition' : 'unresolved',
        previous ? {kind: 'branch', evidence: [...previous.scope.evidence, sentence], polarity: 'negative'} : scoped('unknown', sentence),
        previous ? 'otherwise-linked-to-previous-guard' : 'otherwise-needs-previous-guard'); continue;
    }
    // Temporal phrases stay attached; a prior-state reference is not a new precondition.
    if (/^(?:after|before|once)\b/i.test(value)) {
      const comma = value.indexOf(',');
      add(sentence.start, sentence.end, /^before\b/i.test(value) && guard4.test(value) ? 'precondition' : action4.test(value) ? 'postcondition' : 'unresolved', scoped('temporal', comma < 0 ? sentence : sourceSpan4(text, sentence.start, sentence.start + comma)), 'temporal-context'); continue;
    }
    if (requirement && requirement.index > 0 && action4.test(value.slice(0, requirement.index))) {
      add(sentence.start, sentence.start + requirement.index, 'postcondition', global, 'action-before-explicit-requirement');
      add(sentence.start + requirement.index, sentence.end, 'precondition', scoped('eligibility', sentence), 'explicit-requirement-tail'); continue;
    }
    const cuts: {start: number; end: number}[] = [];
    if (!/\bor\b/i.test(value)) for (const join of value.matchAll(/,\s+(?:and\s+)?|\s+and\s+|,?\s+then\s+/gi)) {
      const prefix = value.slice(0, join.index), tail = value.slice(join.index! + join[0].length);
      if (!predicate4.test(prefix)) continue;
      if (/^(?:returns?|creates?|associates?|links?|records?|updates?|sets|stores?|includes?|makes?|marks?|adds?|clears?|closes?|resets?|timestamps?|increments?)\b/i.test(tail) ||
        /^(?:is|has|have|be)\b/i.test(tail) || /^(?:(?:the|a|an|its|that|whose)\s+[^,.;]{1,70})\s+(?:must|shall|exists?|has|is|are|becomes?|returns?|records?|increases?|decreases?)\b/i.test(tail)) cuts.push({start: join.index!, end: join.index! + join[0].length});
    }
    const firstVerb = firstPredicate4(value);
    const subject = firstVerb && firstVerb.index > 0 ? sourceSpan4(text, sentence.start, sentence.start + firstVerb.index) : null;
    let cursor = 0;
    for (const cut of [...cuts, {start: value.length, end: value.length}]) {
      const part = value.slice(cursor, cut.start);
      let force: Frame4['force'] = null;
      if (/\bmust|shall|required|requires?\b/i.test(part)) force = 'precondition';
      else if (cursor > 0 && guard4.test(value.slice(0, cursor)) && /^(?:is|has|have|be)\b/i.test(part.trim())) force = 'precondition';
      else if (/\bno existing\b/i.test(part)) force = 'precondition';
      const inherits = cursor > 0 && /^(?:is|has|have|be|returns?|creates?|records?|associates?|links?|updates?|sets|stores?|includes?|makes?|marks?|adds?|clears?|closes?|resets?|timestamps?)\b/i.test(part.trim());
      add(sentence.start + cursor, sentence.start + cut.start, force, global, cuts.length ? 'coordination-with-shared-subject' : 'surface-clause', inherits ? subject : null);
      cursor = cut.end;
    }
    // Extract overt adjectival eligibility without inventing an OCL predicate.
    if (!guard4.test(value) && !/^if|^when/i.test(value)) {
      const commaModifier = /\b(?:an?|the) existing,\s+(?:currently\s+)?(?:open|closed)\s+\w+/i.exec(value);
      if (commaModifier) add(sentence.start + commaModifier.index, sentence.start + commaModifier.index + commaModifier[0].length,
        'precondition', scoped('eligibility', sourceSpan4(text, sentence.start + commaModifier.index, sentence.start + commaModifier.index + commaModifier[0].length)), 'explicit-comma-modified-eligibility');
      for (const modifier of value.matchAll(/\b(?:an? |the |for an? )?(?:existing|unused|nonempty)\b(?:\s+(?:open|closed|current))?(?:\s+\w+){1,3}/gi)) {
        const candidate = modifier[0].replace(/\s+(?:that|is|can|selected|located|must|to|in|by|and|or|with|from)\b[\s\S]*$/i, '');
        const start = sentence.start + modifier.index!;
        if (!candidate.trim() || /\bnew\b/i.test(value.slice(Math.max(0, modifier.index! - 12), modifier.index))) continue;
        add(start, start + candidate.length, 'precondition', scoped('eligibility', sourceSpan4(text, start, start + candidate.length)), 'explicit-eligibility-modifier');
      }
    }
  }
  return result;
}
