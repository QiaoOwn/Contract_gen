import {ParserRuleContext} from 'antlr4';
import {RuleAtomicExpressionContext, RuleIsMarkedPreCSContext} from '../antlr4/REMODELParser';
import {generateContractCode, parse} from '../src/app/util';
import loanPayment from '../src/rm2pt/project/LoanProcessingSystem/loanPayment';
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
import {LOAN_PAYMENT_ID} from '../src/app/service/developmentBehavior/loanPaymentSpecification';

export const loanPaymentSettings = {
  project: 'LoanProcessingSystem' as const,
  useCase: 'loanPayment' as const,
  operation: 'loanPayment',
};
const source = loanPayment.relatedService.operations[0];
// Existing project clauses are a functional fixture, not independent ground truth or an LLM outcome.
export const loanPaymentFixture = {
  definition: source.definition ?? '',
  precondition: source.precondition!,
  postcondition: source.postcondition!,
};
export type LoanPaymentControl =
  | 'wrong-direction'
  | 'wrong-status'
  | 'wrong-result'
  | 'overstrict-balance'
  | 'missing-pre';
export const loanPaymentContract = (ocl: typeof loanPaymentFixture) =>
  generateContractCode({
    serviceName: 'LoanProcessingSystemSystem',
    operationName: 'loanPayment',
    parameters: [{name: 'loanid', type: 'Integer'}],
    returnedType: 'Boolean',
    ...ocl,
  });

export function createLoanPaymentControl(ocl: typeof loanPaymentFixture, kind: LoanPaymentControl) {
  if (
    ![
      'wrong-direction',
      'wrong-status',
      'wrong-result',
      'overstrict-balance',
      'missing-pre',
    ].includes(kind)
  )
    throw new Error('Unknown loanPayment control');
  const clause =
    kind === 'wrong-status' || kind === 'overstrict-balance' ? 'precondition' : 'postcondition';
  const contract = loanPaymentContract(ocl);
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
        kind === 'wrong-direction' &&
        left.endsWith('.RemainAmountToPay') &&
        right?.getText().endsWith('.RemainAmountToPay@pre') &&
        node.ruleInfixOperatorName()?.getText() === '-'
      ) {
        const operator = node.ruleInfixOperatorName();
        edit(operator.start.start, operator.stop!.stop + 1, '+');
      }
      if (
        kind === 'wrong-status' &&
        left.endsWith('.Status') &&
        right?.getText() === 'LoanStatus::LSOPEN'
      )
        edit(right.start.start, right.stop!.stop + 1, 'LoanStatus::CLOSED');
      if (kind === 'wrong-result' && left === 'result' && right?.getText() === 'true')
        edit(right.start.start, right.stop!.stop + 1, 'false');
    }
    if (
      kind === 'missing-pre' &&
      node instanceof RuleIsMarkedPreCSContext &&
      node.parentCtx?.getText().endsWith('.RemainAmountToPay@pre')
    )
      edit(node.start.start, node.stop!.stop + 1, '');
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(expression);
  if (kind === 'overstrict-balance') {
    const conjunction = expression.ruleLogicFormulaExpCS();
    if (!conjunction || conjunction.children?.some((child) => child.getText() === 'or'))
      throw new Error('Expected a conjunction-only source precondition');
    // Find the actual loan binding, rather than relying on a fixture variable name.
    const statuses: string[] = [];
    const findStatus = (node: ParserRuleContext) => {
      if (
        node instanceof RuleAtomicExpressionContext &&
        node.ruleRightSubAtomicExpression()?.getText() === 'LoanStatus::LSOPEN'
      ) {
        const left = node.ruleLeftSubAtomicExpression().getText();
        if (left.endsWith('.Status')) statuses.push(left.slice(0, -'.Status'.length));
      }
      for (const child of node.children ?? [])
        if (child instanceof ParserRuleContext) findStatus(child);
    };
    findStatus(expression);
    if (statuses.length !== 1) throw new Error('Expected one source status binding');
    const binding = statuses[0];
    edits.push({
      start: 0,
      end: original.length,
      before: original,
      after: `${original} and ${binding}.RemainAmountToPay >= ${binding}.RepaymentAmount`,
    });
  }
  if (edits.length !== 1)
    throw new Error(`Expected exactly one controlled edit, found ${edits.length}`);
  const change = edits[0];
  const mutated = {
    ...ocl,
    [clause]: original.slice(0, change.start) + change.after + original.slice(change.end),
  };
  if (parse(loanPaymentContract(mutated)).errors.length)
    throw new Error('Mutated candidate does not parse');
  return {
    ocl: mutated,
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode:
        kind === 'overstrict-balance' || kind === 'wrong-status'
          ? 'UNEXPECTED_REJECTION'
          : kind === 'missing-pre'
            ? 'EXECUTION_ERROR'
            : 'OBLIGATION_MISMATCH',
      expectedObligationIds:
        kind === 'overstrict-balance' || kind === 'wrong-status'
          ? ['P01', 'P02']
          : kind === 'missing-pre'
            ? []
            : [kind === 'wrong-result' ? 'Q02' : 'Q01'],
      expectedRepairEligible: kind !== 'missing-pre',
      localizationNote:
        'The injected edit is known to the control harness, not separately disclosed to the agent. Eligibility dependencies and clauses are a search scope, not a proven unique cause.',
    },
  };
}

export async function verifyLoanPaymentCandidate(ocl: typeof loanPaymentFixture) {
  verifyDevelopmentSources(developmentRegistry.require(LOAN_PAYMENT_ID));
  const input = buildOperationInput(loanPaymentSettings);
  const grounding = createOperationModelGrounding(loanPaymentSettings);
  const parsed = parse(loanPaymentContract(ocl));
  if (parsed.errors.length || !parsed.tree) throw new Error('Candidate did not parse');
  const errors = [
    ...validateGeneratedContractSemantics({tree: parsed.tree, hasReturnValue: true}),
    ...validateModelGroundedContract({tree: parsed.tree, context: grounding}).diagnostics,
  ];
  if (errors.length)
    throw new Error(`Candidate static validation failed: ${JSON.stringify(errors)}`);
  const code = await createEntryCode({...loanPaymentSettings, ocl});
  const errorsTs = parseTypescriptEntry(code.entry);
  if (errorsTs.length) throw new Error(`Candidate compilation failed: ${JSON.stringify(errorsTs)}`);
  const report = await evaluateDevelopmentBehavior(code.entry, input.requirement, LOAN_PAYMENT_ID);
  return {
    preExecutionValid: true,
    report,
    repairDiagnostics: developmentRepairDiagnostics(report, grounding, ocl),
  };
}
