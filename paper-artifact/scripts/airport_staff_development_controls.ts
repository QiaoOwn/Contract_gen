import {ParserRuleContext, TerminalNode} from 'antlr4';
import {RuleAtomicExpressionContext, RuleLogicFormulaExpCSContext} from '../antlr4/REMODELParser';
import {generateContractCode, parse} from '../src/app/util';
import manageUser from '../src/rm2pt/project/Airport/manageUser';

export const airportStaffSettings = {
  project: 'Airport' as const,
  useCase: 'manageUser' as const,
  operation: 'createStaff',
};
const operation = manageUser.relatedService.operations.find((item) => item.name === 'createStaff')!;
// Existing source clauses are a functional fixture, not independent ground truth or an LLM result.
export const airportStaffFixture = {
  definition: operation.definition ?? '',
  precondition: operation.precondition!,
  postcondition: operation.postcondition!,
};
export type AirportStaffControl =
  | 'missing-password'
  | 'wrong-boss'
  | 'wrong-result'
  | 'overstrict-boss';

export const airportStaffContract = (ocl: typeof airportStaffFixture) =>
  generateContractCode({
    serviceName: 'AirportSystem',
    operationName: 'createStaff',
    parameters: operation.parameters!.map((item) => ({name: item.name, type: item.type})),
    returnedType: 'Boolean',
    ...ocl,
  });

export function createAirportStaffControl(
  ocl: typeof airportStaffFixture,
  kind: AirportStaffControl
) {
  const clause = kind === 'overstrict-boss' ? 'precondition' : 'postcondition';
  const contract = airportStaffContract(ocl);
  const parsed = parse(contract);
  if (parsed.errors.length || !parsed.tree) throw new Error('Expected a parseable source fixture');
  const expression =
    clause === 'precondition'
      ? parsed.tree.rulePrecondition().ruleOCLExpressionCS()
      : parsed.tree.rulePostcondition().ruleOCLExpressionCS();
  const offset = expression.start.start;
  const original = contract.slice(offset, expression.stop!.stop + 1);
  const edits: {start: number; end: number; before: string; after: string}[] = [];
  const addEdit = (start: number, end: number, after: string) => {
    start -= offset;
    end -= offset;
    if (start < 0 || end > original.length || start >= end) throw new Error('Out-of-clause edit');
    edits.push({start, end, before: original.slice(start, end), after});
  };
  const visit = (node: ParserRuleContext) => {
    if (node instanceof RuleAtomicExpressionContext) {
      if (kind === 'missing-password' && node.getText() === 's.Password=pswd') {
        const parent = node.parentCtx;
        if (
          !(parent instanceof RuleLogicFormulaExpCSContext) ||
          parent.children?.some((child) => child.getText() === 'or')
        )
          throw new Error('Expected a standalone conjunct');
        const previous = parent.children?.[(parent.children?.indexOf(node) ?? 0) - 1];
        if (!(previous instanceof TerminalNode) || previous.getText() !== 'and')
          throw new Error('Expected preceding and');
        addEdit(previous.symbol.start, node.stop!.stop + 1, '');
      }
      if (
        (kind === 'wrong-boss' && node.getText() === 's.Boss=bo') ||
        (kind === 'wrong-result' && node.getText() === 'result=true')
      ) {
        const value = node.ruleRightSubAtomicExpression();
        addEdit(value.start.start, value.stop!.stop + 1, kind === 'wrong-boss' ? 's' : 'false');
      }
    }
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(expression);
  if (kind === 'overstrict-boss') {
    const conjunction = parsed.tree
      .rulePrecondition()
      .ruleOCLExpressionCS()
      .ruleLogicFormulaExpCS();
    if (!conjunction || conjunction.children?.some((child) => child.getText() === 'or'))
      throw new Error('Expected a conjunction-only precondition');
    edits.push({
      start: 0,
      end: original.length,
      before: original,
      after: `${original} and bo.oclIsUndefined() = false`,
    });
  }
  if (edits.length !== 1)
    throw new Error(`Expected exactly one controlled edit, found ${edits.length}`);
  const edit = edits[0];
  const changed = original.slice(0, edit.start) + edit.after + original.slice(edit.end);
  const mutated = {...ocl, [clause]: changed};
  if (parse(airportStaffContract(mutated)).errors.length)
    throw new Error('Control no longer parses');
  return {
    ocl: mutated,
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode: kind === 'overstrict-boss' ? 'UNEXPECTED_REJECTION' : 'OBLIGATION_MISMATCH',
      expectedObligationIds: [
        kind === 'missing-password'
          ? 'Q04'
          : kind === 'wrong-boss'
            ? 'Q07'
            : kind === 'wrong-result'
              ? 'Q10'
              : 'P01',
      ],
      localizationNote:
        'The injected target is known to the control harness, not supplied separately to the repair agent. P01 is an eligibility search scope, not a proven faulty source condition.',
    },
  };
}
