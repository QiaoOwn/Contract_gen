import {ParserRuleContext} from 'antlr4';
import {
  RuleAtomicExpressionContext,
  RuleStandardNavigationCallExpCSContext,
} from '../antlr4/REMODELParser';
import {generateContractCode, parse} from '../src/app/util';
import manageItem from '../src/rm2pt/project/CoCoME/manageItem';
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
import {
  cocomeItemSpecifications,
  type CocomeItemOperation,
} from '../src/app/service/developmentBehavior/cocomeItemSpecification';

type Ocl = {definition: string; precondition: string; postcondition: string};
export type CocomeItemControl =
  | 'query-wrong-object'
  | 'delete-retain-target'
  | 'delete-wrong-result'
  | 'overstrict-positive-barcode';
export const cocomeItemSettings = (operation: CocomeItemOperation) => ({
  project: 'CoCoME' as const,
  useCase: 'manageItem' as const,
  operation,
});
// Project-provided clauses are functional fixtures, not independent ground truth or generated outcomes.
export const cocomeItemFixture = (operation: CocomeItemOperation): Ocl => {
  const source = manageItem.relatedService.operations.find((item) => item.name === operation)!;
  return {
    definition: source.definition ?? '',
    precondition: source.precondition!,
    postcondition: source.postcondition!,
  };
};
export const cocomeItemContract = (ocl: Ocl, operation: CocomeItemOperation) =>
  generateContractCode({
    serviceName: 'ManageItemCRUDService',
    operationName: operation,
    parameters: [{name: 'barcode', type: 'Integer'}],
    returnedType: operation === 'queryItem' ? 'Item' : 'Boolean',
    ...ocl,
  });

export function createCocomeItemControl(
  ocl: Ocl,
  operation: CocomeItemOperation,
  kind: CocomeItemControl
) {
  if (
    ![
      'query-wrong-object',
      'delete-retain-target',
      'delete-wrong-result',
      'overstrict-positive-barcode',
    ].includes(kind) ||
    (kind.startsWith('query-') && operation !== 'queryItem') ||
    (kind.startsWith('delete-') && operation !== 'deleteItem')
  )
    throw new Error('Control does not match the registered operation');
  const clause = kind === 'overstrict-positive-barcode' ? 'precondition' : 'postcondition';
  const parsed = parse(cocomeItemContract(ocl, operation));
  if (parsed.errors.length || !parsed.tree)
    throw new Error('Expected a parseable source candidate');
  const expression =
    clause === 'precondition'
      ? parsed.tree.rulePrecondition().ruleOCLExpressionCS()
      : parsed.tree.rulePostcondition().ruleOCLExpressionCS();
  const contract = cocomeItemContract(ocl, operation);
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
    if (
      node instanceof RuleAtomicExpressionContext &&
      node.ruleLeftSubAtomicExpression().getText() === 'result' &&
      node.ruleInfixCompareOperatorName()?.getText() === '='
    ) {
      const right = node.ruleRightSubAtomicExpression();
      if (kind === 'query-wrong-object')
        edit(
          right.start.start,
          right.stop!.stop + 1,
          'Item.allInstances()->any(other:Item | other.Barcode <> barcode)'
        );
      if (kind === 'delete-wrong-result' && right.getText() === 'true')
        edit(right.start.start, right.stop!.stop + 1, 'false');
    }
    if (
      kind === 'delete-retain-target' &&
      node instanceof RuleStandardNavigationCallExpCSContext &&
      node.ruleClassiferCallExpCS()?.getText() === 'Item.allInstances()'
    ) {
      const token = node.ruleStandardCollectionOperation().start;
      if (token.text === 'excludes') edit(token.start, token.stop + 1, 'includes');
    }
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(expression);
  if (kind === 'overstrict-positive-barcode') {
    const conjunction = expression.ruleLogicFormulaExpCS();
    if (!conjunction || conjunction.children?.some((child) => child.getText() === 'or'))
      throw new Error('Expected a conjunction-only precondition');
    edits.push({
      start: 0,
      end: original.length,
      before: original,
      after: `${original} and barcode > 0`,
    });
  }
  if (edits.length !== 1)
    throw new Error(`Expected exactly one controlled edit, found ${edits.length}`);
  const change = edits[0];
  const changed = {
    ...ocl,
    [clause]: original.slice(0, change.start) + change.after + original.slice(change.end),
  };
  if (parse(cocomeItemContract(changed, operation)).errors.length)
    throw new Error('Mutated contract does not parse');
  return {
    ocl: changed,
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode:
        kind === 'overstrict-positive-barcode' ? 'UNEXPECTED_REJECTION' : 'OBLIGATION_MISMATCH',
      expectedObligationIds: [
        kind === 'overstrict-positive-barcode'
          ? 'P01'
          : kind === 'delete-wrong-result'
            ? 'Q02'
            : 'Q01',
      ],
      localizationNote:
        'The injected edit is known to the harness, not separately disclosed to the model; diagnostic dependencies remain a search scope.',
    },
  };
}

export async function verifyCocomeItemCandidate(ocl: Ocl, operation: CocomeItemOperation) {
  const specification = cocomeItemSpecifications[operation];
  const registration = developmentRegistry.require(specification.id);
  verifyDevelopmentSources(registration);
  const settings = cocomeItemSettings(operation);
  const input = buildOperationInput(settings);
  const grounding = createOperationModelGrounding(settings);
  const parsed = parse(cocomeItemContract(ocl, operation));
  if (parsed.errors.length || !parsed.tree) throw new Error('Candidate did not parse');
  const errors = [
    ...validateGeneratedContractSemantics({tree: parsed.tree, hasReturnValue: true}),
    ...validateModelGroundedContract({tree: parsed.tree, context: grounding}).diagnostics,
  ];
  if (errors.length)
    throw new Error(`Candidate static validation failed: ${JSON.stringify(errors)}`);
  const code = await createEntryCode({...settings, ocl});
  const compilation = parseTypescriptEntry(code.entry);
  if (compilation.length)
    throw new Error(`Candidate compilation failed: ${JSON.stringify(compilation)}`);
  const report = await evaluateDevelopmentBehavior(code.entry, input.requirement, specification.id);
  return {
    preExecutionValid: true,
    report,
    repairDiagnostics: developmentRepairDiagnostics(report, grounding, ocl),
  };
}
