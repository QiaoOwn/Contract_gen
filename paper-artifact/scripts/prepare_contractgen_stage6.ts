import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {read, save, hash} from './lib/m4LiveAdapter';
import {preview6} from './lib/contractgenStage6';

async function main() {
const output = process.argv[2] ?? 'results/contractgen-stage6a-preparation-v6';
assert(!fs.existsSync(output), 'Use a new output directory');
const manifestPath = 'data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json';
const manifest = read(manifestPath);
const definitions = [
  {id: 'CoCoME_manageStore_queryStore', obligations: [
    {key: 'lookup-return', source: [911, 914, 927, 928], meaning: 'Select Store by supplied id and return that actual object.', assertions: ['expect(query(7041)).toBe(target)', 'expect(query(8123)).toBe(target)', 'expect(query(-41)).toBe(target)', 'expect(query(0)).toBe(target)'], limits: 'Finite IDs and ordering; duplicate-ID choice, repository mutation and all Store fields not exhaustively checked.'},
    {key: 'existence', source: [918, 920, 921], meaning: 'Requested Store must exist; do not invent positive-id restriction.', assertions: ['expectPreconditionRejected(() => query(99))', 'expectPreconditionRejected(() => query(404))', 'expect(query(-41)).toBe(target)', 'expect(query(0)).toBe(target)'], limits: 'Reject helper observes rejection, not every possible rejection cause or internal proof.'},
  ]},
  {id: 'LoanProcessingSystem_loanPayment_loanPayment', obligations: [
    {key: 'identity', source: [927, 930], meaning: 'Resolve Loan using LoanID = loanid.', assertions: ['expect(loan.RemainAmountToPay).toBe(before - repayment)', 'expect(neighbor.RemainAmountToPay).toBe(88)'], limits: 'Identity witnessed through selected target effects; not every duplicate identifier policy.'},
    {key: 'guards', source: [934, 935, 938, 939], meaning: 'Loan exists and Status is LSOPEN.', assertions: ['expectPreconditionRejected(() => service.loanPayment(loan.LoanID))', 'expectPreconditionRejected(() => service.loanPayment(99))'], limits: 'Closed/missing cases covered; all possible status encodings not enumerated.'},
    {key: 'amount-effect', source: [943, 947], meaning: 'RemainAmountToPay becomes its pre-value minus RepaymentAmount.', assertions: ['expect(loan.RemainAmountToPay).toBe(9)', 'expect(loan.RemainAmountToPay).toBe(before - repayment)'], limits: '10-1, 31-4, 120.5-13.25, 0-0 are covered; negative repayment, repayment exceeding balance and numeric extremes are not. No positivity restriction invented.'},
    {key: 'return', source: [944, 948], meaning: 'Return true on permitted execution.', assertions: ['expect(result).toBe(true)', 'expect(service.loanPayment(loan.LoanID)).toBe(true)'], limits: 'Only successful scenarios; rejection is distinguished from a normal false return.'},
    {key: 'neighbor-frame', source: [], meaning: 'Oracle additionally checks untouched neighbor fields/repository and rejected-call state.', assertions: ['expect(neighbor.RepaymentAmount).toBe(7)', 'expect(getRepository(Loan)).toEqual([neighbor, loan])'], limits: 'Evaluation frame assumption beyond explicit RM2PT postcondition. Retained unchanged; report its failures separately from explicit source obligations. No new expert approval asserted.'},
  ]},
  {id: 'AutomatedTellerMachine_checkBalance_inputCard', obligations: [
    {key: 'branch-not-global-guard', source: [246, 248, 249, 253, 257], meaning: 'No extra precondition; branch by card existence, not status or owner.', assertions: ['expect(service.inputCard(scenario.key)).toBe(true)', 'expect(service.inputCard(907)).toBe(false)', 'expect(service.inputCard(204)).toBe(false)'], limits: 'Five existing-card variants, two prior validation states and empty repository; no exhaustive status/key domain.'},
    {key: 'found-card-effects', source: [254, 255, 256, 262, 263, 264], meaning: 'For existing card: validation true, current card is selected object, return true.', assertions: ['expect(service.CardIDValidated).toBe(true)', 'expect(service.InputCard).toBe(target)', 'expect(service.inputCard(scenario.key)).toBe(true)'], limits: 'Target placed after neighbor; duplicate IDs and all card-field frame properties not specified/exhausted.'},
    {key: 'missing-card-effects', source: [258, 259, 266, 267, 268], meaning: 'For absent card: validation false, return false normally.', assertions: ['expect(service.inputCard(907)).toBe(false)', 'expect(service.inputCard(204)).toBe(false)', 'expect(service.CardIDValidated).toBe(false)'], limits: 'InputCard value is unspecified in this branch: no preservation/clearing requirement may be inferred.'},
  ]},
];
const mapping = definitions.map(definition => {
  const record = manifest.records.find((row: {id: string}) => row.id === definition.id);
  assert(record);
  const oracle = fs.readFileSync(record.historical_jest, 'utf8'), source = fs.readFileSync(record.source_path, 'utf8');
  assert.equal(hash(oracle), record.jest_sha256);
  assert.equal(hash(source), record.source_sha256);
  const sourceLines = source.split(/\r?\n/), testLines = oracle.split(/\r?\n/);
  const tree = ts.createSourceFile(record.historical_jest, oracle, ts.ScriptTarget.Latest, true);
  const scenarios: {title: string; startLine: number; endLine: number; assertionLines: number[]}[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.arguments.length >= 2 && ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.getText(tree) === 'it' || node.expression.getText(tree).startsWith('it.each('))) {
      const startLine = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
      const endLine = tree.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      scenarios.push({title: node.arguments[0].text, startLine, endLine,
        assertionLines: testLines.flatMap((text, i) => i + 1 >= startLine && i + 1 <= endLine &&
          (text.includes('expect(') || text.includes('expectPreconditionRejected(')) ? [i + 1] : [])});
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  assert(scenarios.length > 0);
  const narrative = fs.readFileSync('data/narrative_v3_114/generation/requirements.jsonl', 'utf8').trim().split(/\r?\n/)
    .map(line => JSON.parse(line)).find(row => row.operationId === definition.id);
  return {...definition, narrative: narrative.description, oracle: record.historical_jest, oracleSha256: record.jest_sha256, scenarios,
    sourcePath: record.source_path, sourceSha256: record.source_sha256, sourceRange: record.source_lines,
    originalSourceExcerpt: sourceLines.slice(record.source_lines[0] - 1, record.source_lines[1]).map((text, index) => ({line: record.source_lines[0] + index, text})),
    declaredManifestStatus: {status: record.status, reviewStatus: record.review_status, decisionFile: record.decision_file ?? null},
    obligations: definition.obligations.map(item => {
      const source = definition.id.includes('inputCard') ? ({
        'branch-not-global-guard': [238, 241, 245, 248, 252, 262],
        'found-card-effects': [253, 254, 255, 264, 265, 266],
        'missing-card-effects': [256, 257, 258, 267, 268, 269],
      } as Record<string, number[]>)[item.key] : item.key === 'lookup-return' ? [911, 914, 925, 928] : item.source;
      return {...item, source,
      sourceEvidence: source.map(line => ({line, text: sourceLines[line - 1]})),
      assertionEvidence: item.assertions.map(fragment => {const lines = testLines.flatMap((text, index) => text.includes(fragment) ? [{line: index + 1, text}] : []);
        assert(lines.length > 0, `Missing mapped assertion: ${fragment}`); return {fragment, lines,
          scenarios: scenarios.filter(scenario => lines.some(line => line.line >= scenario.startLine && line.line <= scenario.endLine))};}),
      coverageStatus: item.source.length ? 'finite-source-observation' : 'extra-frame-assumption',
      executionStatusThisStage: 'not-run', semanticProof: false};})};
});
save(`${output}/oracle-coverage.json`, {version: 'stage6a-coverage-v1', formalReady: manifest.formal_experiment_ready,
  manifestSha256: hash(fs.readFileSync(manifestPath)), operations: mapping,
  publicationObstacles: ['Manifest role remains preparation-only-not-formal-suite.',
    'Manifest still contains pending review / functional replay statuses; these are stored metadata, not a new audit verdict.',
    'No three-pilot candidate behavioral replay was performed in Stage6A.',
    'Finite assertions do not exhaust source semantics; loanPayment contains additional frame assumptions requiring separately labelled interpretation.'],
  sourceDecisions: 'Original inputCard source behavior retained. Existing lab clarifications are not invented or reapproved here. No source/Oracle was changed.'});
const preview = await preview6(`${output}/preview`, `${output}/oracle-coverage.json`);
save(`${output}/preparation.json`, {...preview, oracleCoveragePath: `${output}/oracle-coverage.json`,
  provisional: true, oracleModified: false, inputsModified: false});
console.log(JSON.stringify({output, operations: mapping.length, ...preview}));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
