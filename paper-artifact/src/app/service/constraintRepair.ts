import {generateContractCode, parse} from '../util';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';

export const CONSTRAINT_SYNTAX_GUIDANCE = [
  'Use only the supplied OCLTSVM grammar. A comparison operand cannot be an if expression, even inside parentheses. Express conditional assignments with the if around complete comparison/effect branches.',
  'A Boolean and/or chain starts with an atomic expression in this grammar, not a parenthesized group or an if. Nested groups and conditional expressions can follow an and/or operator; alternatively use a complete if expression as the clause. Preserve the required guards and grouping; do not invent a dummy condition or delete obligations to satisfy syntax.',
  'Copy task evidence from the candidate. Compound evidence must remain inside a single Boolean chain with the same operator, binding scope and conditional branch. An existing if or let subtree may be referenced directly.',
].join('\n');

export function constraintRepairContext(
  previous: RepairCandidate,
  diagnostics: RepairDiagnostic[],
  context: OperationModelGrounding
) {
  const op = context.index.operation;
  const contract = generateContractCode({
    serviceName: op.service,
    operationName: op.name,
    parameters: op.parameters.map((parameter) => ({
      name: parameter.name,
      type: parameter.type.raw,
    })),
    returnedType: op.returnType?.type.raw,
    ...previous,
  });
  const parsed = parse(contract);
  const lines = contract.split('\n');
  const sourcePosition = (diagnostic: RepairDiagnostic) => {
    const {line, column} = diagnostic.location;
    if (!Number.isInteger(line) || !Number.isInteger(column) || line! < 1 || line! > lines.length)
      return null;
    const text = lines[line! - 1];
    if (column! < 0 || column! > text.length) return null;
    return {
      line: line!,
      column: column!,
      text,
      offset: lines.slice(0, line! - 1).reduce((sum, part) => sum + part.length + 1, 0) + column!,
    };
  };
  const template = generateContractCode({
    serviceName: op.service,
    operationName: op.name,
    parameters: op.parameters.map((parameter) => ({
      name: parameter.name,
      type: parameter.type.raw,
    })),
    returnedType: op.returnType?.type.raw,
    definition: previous.definition ? '__CLAUSE_definition__' : '',
    precondition: '__CLAUSE_precondition__',
    postcondition: '__CLAUSE_postcondition__',
  });
  let shift = 0;
  const regions = [...template.matchAll(/__CLAUSE_(definition|precondition|postcondition)__/g)].map(
    (match) => {
      const clause = match[1] as keyof RepairCandidate;
      const startOffset = match.index! + shift;
      shift += previous[clause].length - match[0].length;
      return {clause, startOffset, endOffset: startOffset + previous[clause].length};
    }
  );
  const localized = diagnostics.map((diagnostic) => {
    if (diagnostic.stage !== 'parser' || diagnostic.location.clause) return diagnostic;
    const position = sourcePosition(diagnostic);
    if (!position) return diagnostic;
    const region = regions.find(
      (item) => item.startOffset <= position.offset && position.offset <= item.endOffset
    );
    return region
      ? {...diagnostic, location: {...diagnostic.location, clause: region.clause}}
      : diagnostic;
  });
  const evidenceOnly =
    !parsed.errors.length &&
    localized.length > 0 &&
    localized.every((diagnostic) =>
      ['TASK_EVIDENCE_NOT_FOUND', 'TASK_EVIDENCE_MISSING', 'TASK_SCOPE'].includes(diagnostic.code)
    );
  const syntaxOnly =
    parsed.errors.length > 0 &&
    localized.length > 0 &&
    localized.every(
      (diagnostic) =>
        diagnostic.stage === 'parser' && diagnostic.location.clause && sourcePosition(diagnostic)
    );
  const mode = evidenceOnly
    ? 'evidence-only'
    : syntaxOnly
      ? 'syntax-clause-scoped'
      : 'diagnostic-directed';
  return {
    mode,
    diagnostics: localized,
    allowedClauses: evidenceOnly
      ? []
      : syntaxOnly
        ? [...new Set(localized.map((diagnostic) => diagnostic.location.clause!))]
        : null,
    parserContext: localized
      .filter((diagnostic) => diagnostic.stage === 'parser')
      .map((diagnostic) => {
        const position = sourcePosition(diagnostic);
        const start = position ? Math.max(0, position.column - 400) : undefined;
        const end = position ? Math.min(position.text.length, start! + 1600) : undefined;
        return {
          code: diagnostic.code,
          message: diagnostic.msg,
          clause: diagnostic.location.clause ?? null,
          coordinateSpace: 'assembled-contract',
          line: diagnostic.location.line,
          column: diagnostic.location.column,
          columnBase: 0,
          sourceLocationValidated: Boolean(position),
          sourceLine: position?.text.slice(start, end),
          sourceLineStartColumn: start,
          sourceLineEndColumn: end,
          errorColumnInExcerpt: position ? position.column - start! : undefined,
          sourceLineTruncated: position ? start! > 0 || end! < position.text.length : false,
          localizationBasis:
            'parser-coordinate-within-generated-clause-span-not-proven-semantic-root-cause',
        };
      }),
  };
}

export function auditConstraintRepairScope(
  before: RepairCandidate,
  after: RepairCandidate,
  repair: ReturnType<typeof constraintRepairContext>
) {
  const changedClauses = (['definition', 'precondition', 'postcondition'] as const).filter(
    (clause) => before[clause] !== after[clause]
  );
  const outsideClauses =
    repair.allowedClauses === null
      ? []
      : changedClauses.filter((clause) => !repair.allowedClauses!.includes(clause));
  return {
    mode: repair.mode,
    allowedClauses: repair.allowedClauses,
    changedClauses,
    outsideClauses,
    blocked: outsideClauses.length > 0,
    status: outsideClauses.length
      ? 'scope-violation'
      : repair.allowedClauses === null
        ? 'delegated-to-directed-repair'
        : 'protected-clauses-preserved',
  };
}
