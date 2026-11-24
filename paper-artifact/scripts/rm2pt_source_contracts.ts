import ts from 'typescript';

export type SourceToken = {kind: ts.SyntaxKind; text: string; value: string; start: number; end: number};
export function sourceTokens(text: string): SourceToken[] {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const result: SourceToken[] = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan())
    result.push({kind, text: scanner.getTokenText(), value: scanner.getTokenValue(),
      start: scanner.getTokenPos(), end: scanner.getTextPos()});
  return result;
}
export function normalizedSourceClause(text: string | undefined): string {
  return JSON.stringify(sourceTokens(text ?? '').map(token =>
    token.kind === ts.SyntaxKind.StringLiteral ? ['string', token.value]
      : token.text === 'allInstance' ? 'allInstances' : token.text));
}
export type SourceContract = {
  service: string; operation: string; signature: string; line: number; endLine: number;
  parameters: {name: string; type: string}[]; returnType: string | null;
  definition: string; precondition: string; postcondition: string;
  clauseLines: Record<'definition' | 'precondition' | 'postcondition', [number, number] | null>;
};
export function extractCommentedSourceContract(text: string, firstLine: number, lastLine: number): SourceContract {
  const lines = text.split(/\r?\n/);
  if (!Number.isInteger(firstLine) || !Number.isInteger(lastLine) || firstLine < 1 || lastLine < firstLine || lastLine > lines.length)
    throw new Error('Invalid commented source range');
  const selected = lines.slice(firstLine - 1, lastLine);
  if (selected.some(line => line.trim() && !/^\s*\/\//.test(line)))
    throw new Error('Approved draft range must contain only line-commented source');
  const restored = '\n'.repeat(firstLine - 1) + selected.map(line => line.replace(/^(\s*)\/\//, '$1')).join('\n');
  const contracts = extractSourceContracts(restored);
  if (contracts.length !== 1 || contracts[0].line !== firstLine || contracts[0].endLine !== lastLine)
    throw new Error('Approved draft range must identify exactly one complete contract');
  return contracts[0];
}
export function extractSourceContracts(text: string): SourceContract[] {
  const tokens = sourceTokens(text);
  const line = (offset: number) => text.slice(0, offset).split(/\r?\n/).length;
  const contracts: SourceContract[] = [];
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].text !== 'Contract' || tokens[index + 2]?.text !== ':' || tokens[index + 3]?.text !== ':' || tokens[index + 5]?.text !== '(') continue;
    const start = index;
    const service = tokens[index + 1].text, operation = tokens[index + 4].text;
    let cursor = index + 6, depth = 1, parameterStart = cursor;
    const parameters: {name: string; type: string}[] = [];
    const parameter = (from: number, to: number) => {
      if (from === to) return;
      if (tokens[from + 1]?.text !== ':') throw new Error(`Invalid source parameter at ${line(tokens[from].start)}`);
      parameters.push({name: tokens[from].text, type: text.slice(tokens[from + 2].start, tokens[to - 1].end).trim()});
    };
    for (; cursor < tokens.length; cursor++) {
      const token = tokens[cursor];
      if (token.text === '(') depth++;
      if (token.text === ')') depth--;
      if (depth === 0) { parameter(parameterStart, cursor); break; }
      if (depth === 1 && token.text === ',') {parameter(parameterStart, cursor); parameterStart = cursor + 1;}
    }
    if (depth !== 0) throw new Error(`Unclosed source parameters ${service}::${operation}`);
    const close = cursor++;
    let returnType: string | null = null;
    if (tokens[cursor]?.text === ':') {
      const returnStart = ++cursor;
      while (cursor < tokens.length && tokens[cursor].text !== '{') cursor++;
      returnType = text.slice(tokens[returnStart].start, tokens[cursor - 1].end).trim();
    }
    if (tokens[cursor]?.text !== '{') throw new Error(`Missing source contract body ${service}::${operation}`);
    const open = cursor++;
    depth = 1;
    const sections: {name: 'definition' | 'precondition' | 'postcondition'; index: number}[] = [];
    for (; cursor < tokens.length; cursor++) {
      if (tokens[cursor].text === '{') depth++;
      if (tokens[cursor].text === '}') depth--;
      if (!depth) break;
      if (depth === 1 && ['definition', 'precondition', 'postcondition'].includes(tokens[cursor].text) && tokens[cursor + 1]?.text === ':')
        sections.push({name: tokens[cursor].text as typeof sections[number]['name'], index: cursor});
    }
    if (depth || sections.filter(section => section.name === 'precondition').length !== 1 || sections.filter(section => section.name === 'postcondition').length !== 1)
      throw new Error(`Incomplete or ambiguous source clauses ${service}::${operation}:${line(tokens[start].start)}`);
    const clauses = {definition: '', precondition: '', postcondition: ''};
    const clauseLines: SourceContract['clauseLines'] = {definition: null, precondition: null, postcondition: null};
    sections.forEach((section, position) => {
      const first = section.index + 2;
      const end = sections[position + 1]?.index ?? cursor;
      clauses[section.name] = text.slice(tokens[first].start, tokens[end - 1].end).trim();
      clauseLines[section.name] = [line(tokens[first].start), line(tokens[end - 1].end)];
    });
    contracts.push({service, operation, parameters, returnType,
      signature: text.slice(tokens[start + 4].start, tokens[open].start).trim(),
      line: line(tokens[start].start), endLine: line(tokens[cursor].end), clauseLines, ...clauses});
    void close;
    index = cursor;
  }
  return contracts;
}
