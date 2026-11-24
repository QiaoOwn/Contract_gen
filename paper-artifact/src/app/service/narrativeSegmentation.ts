export type NarrativeSegment = {text: string; start: number; end: number; context?: {start: number; end: number; exactText: string}};

/** Split explicit coordination, retaining the original sentence as inherited context. */
export function segmentNarrative(text: string): NarrativeSegment[] {
  const out: NarrativeSegment[] = [];
  for (const sentence of text.matchAll(/[\s\S]+?(?:[.!?;](?=\s|$)|$)/g)) {
    const raw = sentence[0];
    if (!raw.trim()) continue;
    const offset = sentence.index!;
    const context = {start: offset + raw.indexOf(raw.trim()), end: offset + raw.trimEnd().length, exactText: raw.trim()};
    const boundaries: {start: number; end: number}[] = [];
    // Do not detach a guard from a branch, or break disjunction into independent requirements.
    if (!/\b(if|when|unless|otherwise|or)\b/i.test(raw)) {
      const joins = /(?:,\s+and\s+|\s+and\s+|,\s+)/g;
      for (const join of raw.matchAll(joins)) {
        // Do not split a coordinated subject or introductory phrase before its predicate.
        const prefix = raw.slice(0, join.index);
        if (!/\b(?:must|shall|requires?|exists?|has|is|are|becomes?|increases?|decreases?|returns?|records?|creates?|stores?|links?|sets|adds?|makes?|timestamps?|marks?)\b/i.test(prefix)) continue;
        const tail = raw.slice(join.index! + join[0].length);
        const explicitSubject = /^(?:(?:the|a|an|another|its|whose)\s+[^,.;]+?|[A-Z][A-Za-z]+(?:\.[A-Za-z]+)?)\s+(?:must|shall|exists?|has|is|are|becomes?|increases?|decreases?|returns?|records?|starts?)\b/i.test(tail);
        const action = /^(?:returns?|creates?|stores?|makes?|links?|sets?|timestamps?|marks?|adds?|closes?|clears?|records?)\b/i.test(tail);
        const inherited = /^(?:be\s+|have\s+|is\s+|has\s+|becomes?\s+)(?!linked\b)/i.test(tail);
        if (explicitSubject || action || inherited) boundaries.push({start: join.index!, end: join.index! + join[0].length});
      }
    }
    let cursor = 0;
    for (const boundary of [...boundaries, {start: raw.length, end: raw.length}]) {
      const piece = raw.slice(cursor, boundary.start), trimmed = piece.trim();
      if (trimmed) out.push({text: trimmed, start: offset + cursor + piece.indexOf(trimmed),
        end: offset + cursor + piece.indexOf(trimmed) + trimmed.length, ...(boundaries.length ? {context} : {})});
      cursor = boundary.end;
    }
  }
  return out;
}
