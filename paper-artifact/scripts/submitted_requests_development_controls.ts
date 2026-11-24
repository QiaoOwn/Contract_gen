import {ParserRuleContext, TerminalNode} from 'antlr4';
import {RuleAtomicExpressionContext, RuleLogicFormulaExpCSContext} from '../antlr4/REMODELParser';
import {generateContractCode, parse} from '../src/app/util';
import sourceUseCase from '../src/rm2pt/project/LoanProcessingSystem/enterValidatedCreditReferences';
import {createEntryCode} from '../src/app/service/createEntryCode';
import {parseTypescriptEntry} from '../src/app/service/parseTypescriptEntry';
import {createOperationModelGrounding} from '../src/app/service/operationModelGrounding';
import {validateGeneratedContractSemantics} from '../src/app/service/validateGeneratedContractSemantics';
import {validateModelGroundedContract} from '../src/app/service/validateModelGroundedContract';
import {buildOperationInput} from '../src/app/service/createOperationInput';
import {evaluateDevelopmentBehavior} from '../src/app/service/developmentBehavior/evaluateDevelopmentBehavior';
import {developmentRepairDiagnostics} from '../src/app/service/developmentBehavior/developmentRepair';
import {
  developmentRegistry,
  verifyDevelopmentSources,
} from '../src/app/service/developmentBehavior/registry';
import {SUBMITTED_REQUESTS_ID} from '../src/app/service/developmentBehavior/submittedLoanRequestsSpecification';

export const submittedRequestsSettings = {
  project: 'LoanProcessingSystem' as const,
  useCase: 'enterValidatedCreditReferences' as const,
  operation: 'listSubmitedLoanRequest',
};
const source = sourceUseCase.relatedService.operations[0];
// Source-provided clauses exercise the mechanism; they are not independent ground truth or a model outcome.
export const submittedRequestsFixture = {
  definition: source.definition ?? '',
  precondition: source.precondition!,
  postcondition: source.postcondition!,
};
export type SubmittedRequestsControl =
  | 'missing-current-update'
  | 'wrong-return'
  | 'overstrict-count';
export const submittedRequestsContract = (ocl: typeof submittedRequestsFixture) =>
  generateContractCode({
    serviceName: 'EnterValidatedCreditReferencesModule',
    operationName: 'listSubmitedLoanRequest',
    parameters: [],
    returnedType: 'Set(LoanRequest)',
    ...ocl,
  });
export function createSubmittedRequestsControl(
  ocl: typeof submittedRequestsFixture,
  kind: SubmittedRequestsControl
) {
  if (!['missing-current-update', 'wrong-return', 'overstrict-count'].includes(kind))
    throw new Error('Unknown submitted requests control');
  const clause = kind === 'overstrict-count' ? 'precondition' : 'postcondition';
  const contract = submittedRequestsContract(ocl);
  const parsed = parse(contract);
  if (parsed.errors.length || !parsed.tree)
    throw new Error('Expected a parseable source candidate');
  const expression =
    clause === 'precondition'
      ? parsed.tree.rulePrecondition().ruleOCLExpressionCS()
      : parsed.tree.rulePostcondition().ruleOCLExpressionCS();
  const offset = expression.start.start;
  const original = contract.slice(offset, expression.stop!.stop + 1);
  const edits: {start: number; end: number; before: string; after: string}[] = [];
  const edit = (start: number, end: number, after: string) => {
    start -= offset;
    end -= offset;
    if (start < 0 || end > original.length || start >= end)
      throw new Error('Out-of-clause mutation');
    edits.push({start, end, before: original.slice(start, end), after});
  };
  const visit = (node: ParserRuleContext) => {
    if (node instanceof RuleAtomicExpressionContext) {
      const left = node.ruleLeftSubAtomicExpression().getText();
      const right = node.ruleRightSubAtomicExpression();
      if (
        kind === 'missing-current-update' &&
        left === 'self.CurrentLoanRequests' &&
        node.ruleInfixCompareOperatorName()?.getText() === '='
      ) {
        const parent = node.parentCtx;
        if (
          !(parent instanceof RuleLogicFormulaExpCSContext) ||
          parent.children?.some((child) => child.getText() === 'or')
        )
          throw new Error('Expected a standalone conjunct');
        const children = parent.children ?? [];
        const index = children.indexOf(node);
        const next = children[index + 1];
        const previous = children[index - 1];
        if (next instanceof TerminalNode && next.getText() === 'and')
          edit(node.start.start, next.symbol.stop + 1, '');
        else if (previous instanceof TerminalNode && previous.getText() === 'and')
          edit(previous.symbol.start, node.stop!.stop + 1, '');
        else throw new Error('Expected adjacent and');
      }
      if (
        kind === 'wrong-return' &&
        left === 'result' &&
        right &&
        node.ruleInfixCompareOperatorName()?.getText() === '='
      )
        edit(right.start.start, right.stop!.stop + 1, 'LoanRequest.allInstances()');
      if (
        kind === 'overstrict-count' &&
        left.endsWith('.size()') &&
        node.ruleInfixCompareOperatorName()?.getText() === '>' &&
        right?.getText() === '0'
      )
        edit(right.start.start, right.stop!.stop + 1, '1');
    }
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(expression);
  if (edits.length !== 1)
    throw new Error(`Expected exactly one controlled edit, found ${edits.length}`);
  const change = edits[0];
  if (change.before === change.after)
    throw new Error('Control would not change the source candidate');
  const mutated = {
    ...ocl,
    [clause]: original.slice(0, change.start) + change.after + original.slice(change.end),
  };
  if (parse(submittedRequestsContract(mutated)).errors.length)
    throw new Error('Mutated candidate does not parse');
  return {
    ocl: mutated,
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode: kind === 'overstrict-count' ? 'UNEXPECTED_REJECTION' : 'OBLIGATION_MISMATCH',
      expectedObligationIds: [
        kind === 'missing-current-update' ? 'Q01' : kind === 'wrong-return' ? 'Q02' : 'P01',
      ],
      expectedRepairEligible: true,
      localizationNote:
        'The controlled edit is known to the harness, not disclosed separately to the agent. Requirement and model dependencies delimit a search scope, not a proven unique cause.',
    },
  };
}
export async function verifySubmittedRequestsCandidate(ocl: typeof submittedRequestsFixture) {
  verifyDevelopmentSources(developmentRegistry.require(SUBMITTED_REQUESTS_ID));
  const input = buildOperationInput(submittedRequestsSettings);
  const grounding = createOperationModelGrounding(submittedRequestsSettings);
  const parsed = parse(submittedRequestsContract(ocl));
  if (parsed.errors.length || !parsed.tree) throw new Error('Candidate did not parse');
  const errors = [
    ...validateGeneratedContractSemantics({tree: parsed.tree, hasReturnValue: true}),
    ...validateModelGroundedContract({tree: parsed.tree, context: grounding}).diagnostics,
  ];
  if (errors.length)
    throw new Error(`Candidate static validation failed: ${JSON.stringify(errors)}`);
  const code = await createEntryCode({...submittedRequestsSettings, ocl});
  const errorsTs = parseTypescriptEntry(code.entry);
  if (errorsTs.length) throw new Error(`Candidate compilation failed: ${JSON.stringify(errorsTs)}`);
  const report = await evaluateDevelopmentBehavior(
    code.entry,
    input.requirement,
    SUBMITTED_REQUESTS_ID
  );
  return {
    preExecutionValid: true,
    report,
    repairDiagnostics: developmentRepairDiagnostics(report, grounding, ocl),
  };
}
