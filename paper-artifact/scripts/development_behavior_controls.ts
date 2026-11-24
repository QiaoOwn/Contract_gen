import {ParserRuleContext, TerminalNode} from 'antlr4';
import {
  RuleAtomicExpressionContext,
  RuleLogicFormulaExpCSContext,
  RuleStandardDateOperationContext,
  RuleStandardNavigationCallExpCSContext,
} from '../antlr4/REMODELParser';
import {parse} from '../src/app/util';
import catalog from '../config/development-repair-controls.json';

export type DevelopmentControlKind =
  | 'wrong-due-date'
  | 'missing-user-loan-link'
  | 'overstrict-precondition';
type Ocl = {definition: string; precondition: string; postcondition: string};
type Edit = {start: number; end: number; before: string; after: string};

export function createDevelopmentControl(
  ocl: Ocl,
  kind: DevelopmentControlKind = 'wrong-due-date'
) {
  if (!['wrong-due-date', 'missing-user-loan-link', 'overstrict-precondition'].includes(kind))
    throw new Error('This control adapter only accepts BorrowBook controls');
  const specification = catalog.controls[kind];
  if (!specification) throw new Error(`Unknown development control: ${kind}`);
  const clause = specification.clause as 'precondition' | 'postcondition';
  const original = ocl[clause];
  const prefix = `Contract LibraryManagementSystemSystem::borrowBook(uid:String, barcode:String): Boolean { ${clause === 'precondition' ? 'precondition' : 'precondition: true postcondition'}:\n`;
  const suffix = clause === 'precondition' ? '\npostcondition: result = true\n}' : '\n}';
  const parsed = parse(`${prefix}${original}${suffix}`);
  if (parsed.errors.length || !parsed.tree)
    throw new Error(`Control requires a parseable ${clause}`);
  const edits: Edit[] = [];
  const edit = (start: number, end: number, after: string) => {
    start -= prefix.length;
    end -= prefix.length;
    if (start < 0 || end > original.length || start >= end)
      throw new Error('Control edit is outside its target clause');
    edits.push({start, end, before: original.slice(start, end), after});
  };
  const visit = (node: ParserRuleContext) => {
    if (
      kind === 'wrong-due-date' &&
      node instanceof RuleStandardDateOperationContext &&
      node.start.text === 'After'
    ) {
      const number = node.ruleNumberLiteralExpCS();
      if (number?.getText() === '30') edit(number.start.start, number.stop!.stop + 1, '10');
    }
    if (
      kind === 'missing-user-loan-link' &&
      node instanceof RuleStandardNavigationCallExpCSContext &&
      node.rulePropertyCallExpCS()?.ruleSimpleNameCS().getText() === 'LoanedBook' &&
      !node.rulePropertyCallExpCS()?.ruleIsMarkedPreCS() &&
      node.ruleStandardCollectionOperation().start.text === 'includes'
    ) {
      let atomic: ParserRuleContext | null = node;
      while (atomic && !(atomic instanceof RuleAtomicExpressionContext))
        atomic = atomic.parentCtx ?? null;
      const conjunction = atomic?.parentCtx;
      if (
        !(atomic instanceof RuleAtomicExpressionContext) ||
        atomic.getText() !== node.getText() ||
        !(conjunction instanceof RuleLogicFormulaExpCSContext) ||
        conjunction.children?.some((child) => child.getText() === 'or')
      ) {
        throw new Error(
          'LoanedBook update is not a standalone conjunction; do not guess a deletion'
        );
      }
      const children = conjunction.children ?? [];
      const previous = children[children.indexOf(atomic) - 1];
      if (!(previous instanceof TerminalNode) || previous.getText() !== 'and') {
        throw new Error(
          'LoanedBook update must have a preceding conjunction for this controlled deletion'
        );
      }
      edit(previous.symbol.start, atomic.stop!.stop + 1, '');
    }
    if (
      kind === 'overstrict-precondition' &&
      node instanceof RuleAtomicExpressionContext &&
      node
        .ruleLeftSubAtomicExpression()
        .ruleCallExpCS()
        ?.ruleFeatureCallExpCS()
        ?.rulePropertyCallExpCS()
        ?.ruleSimpleNameCS()
        .getText() === 'LoanedNumber' &&
      node.ruleInfixCompareOperatorName()?.getText() === '<' &&
      node.ruleRightSubAtomicExpression()?.getText() === '20' &&
      !node.ruleInfixOperatorName()
    ) {
      const number = node.ruleRightSubAtomicExpression();
      edit(number.start.start, number.stop!.stop + 1, '5');
    }
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(parsed.tree);
  if (!edits.length || (kind !== 'wrong-due-date' && edits.length !== 1)) {
    throw new Error(
      `Expected ${kind === 'wrong-due-date' ? 'at least one date' : 'exactly one'} mutation target for ${kind}; found ${edits.length}`
    );
  }
  let changed = original;
  for (const item of [...edits].sort((a, b) => b.start - a.start)) {
    changed = changed.slice(0, item.start) + item.after + changed.slice(item.end);
  }
  if (parse(`${prefix}${changed}${suffix}`).errors.length)
    throw new Error('Mutated clause failed parsing');
  return {
    ocl: {...ocl, [clause]: changed},
    mutation: {...specification, controlKind: kind, catalogVersion: catalog.version, edits},
  };
}
