import {ParserRuleContext} from 'antlr4';
import {
  RuleAtomicExpressionContext,
  RuleStandardNavigationCallExpCSContext,
} from '../antlr4/REMODELParser';
import {generateContractCode, parse} from '../src/app/util';
import manageStore from '../src/rm2pt/project/CoCoME/manageStore';
import manageProductCatalog from '../src/rm2pt/project/CoCoME/manageProductCatalog';
import manageCashDesk from '../src/rm2pt/project/CoCoME/manageCashDesk';
import manageCashier from '../src/rm2pt/project/CoCoME/manageCashier';
import manageSupplier from '../src/rm2pt/project/CoCoME/manageSupplier';
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
  cocomeDeletionSpecifications,
  type CocomeDeletionOperation,
} from '../src/app/service/developmentBehavior/cocomeDeletionsSpecification';

export type DeletionOcl = {definition: string; precondition: string; postcondition: string};
export type CocomeDeletionControl = 'retain-target' | 'wrong-result' | 'overstrict-positive-id';
export const cocomeDeletionControlKinds: readonly CocomeDeletionControl[] = [
  'retain-target',
  'wrong-result',
  'overstrict-positive-id',
];
const project = {manageStore, manageProductCatalog, manageCashDesk, manageCashier, manageSupplier};
export const cocomeDeletionSettings = (operation: CocomeDeletionOperation) => ({
  project: 'CoCoME' as const,
  useCase: cocomeDeletionSpecifications[operation].useCase,
  operation,
});
// Source clauses are functional fixtures, not independent references or generated outcomes.
export const cocomeDeletionFixture = (operation: CocomeDeletionOperation): DeletionOcl => {
  const spec = cocomeDeletionSpecifications[operation];
  const source = project[spec.useCase].relatedService.operations.find(
    (item) => item.name === operation
  );
  if (!source) throw new Error(`Missing source fixture for ${spec.id}`);
  return {
    definition: source.definition ?? '',
    precondition: source.precondition!,
    postcondition: source.postcondition!,
  };
};
export const cocomeDeletionContract = (ocl: DeletionOcl, operation: CocomeDeletionOperation) =>
  generateContractCode({
    serviceName: cocomeDeletionSpecifications[operation].service,
    operationName: operation,
    parameters: [{name: 'id', type: 'Integer'}],
    returnedType: 'Boolean',
    ...ocl,
  });
export function createCocomeDeletionControl(
  ocl: DeletionOcl,
  operation: CocomeDeletionOperation,
  kind: CocomeDeletionControl
) {
  if (
    !Object.hasOwn(cocomeDeletionSpecifications, operation) ||
    !cocomeDeletionControlKinds.includes(kind)
  )
    throw new Error('Control does not match the registered operation');
  const spec = cocomeDeletionSpecifications[operation];
  const clause = kind === 'overstrict-positive-id' ? 'precondition' : 'postcondition';
  const contract = cocomeDeletionContract(ocl, operation);
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
    if (
      kind === 'retain-target' &&
      node instanceof RuleStandardNavigationCallExpCSContext &&
      node.ruleClassiferCallExpCS()?.getText() === `${spec.entity}.allInstances()`
    ) {
      const token = node.ruleStandardCollectionOperation().start;
      if (token.text === 'excludes') edit(token.start, token.stop + 1, 'includes');
    }
    if (
      kind === 'wrong-result' &&
      node instanceof RuleAtomicExpressionContext &&
      node.ruleLeftSubAtomicExpression().getText() === 'result' &&
      node.ruleInfixCompareOperatorName()?.getText() === '='
    ) {
      const right = node.ruleRightSubAtomicExpression();
      if (right.getText() === 'true') edit(right.start.start, right.stop!.stop + 1, 'false');
    }
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(expression);
  if (kind === 'overstrict-positive-id') {
    const conjunction = expression.ruleLogicFormulaExpCS();
    if (!conjunction || conjunction.children?.some((child) => child.getText() === 'or'))
      throw new Error('Expected conjunction-only precondition');
    edits.push({start: 0, end: original.length, before: original, after: `${original} and id > 0`});
  }
  if (edits.length !== 1)
    throw new Error(`Expected exactly one controlled edit, found ${edits.length}`);
  const change = edits[0];
  const changed = {
    ...ocl,
    [clause]: original.slice(0, change.start) + change.after + original.slice(change.end),
  };
  if (parse(cocomeDeletionContract(changed, operation)).errors.length)
    throw new Error('Mutated contract does not parse');
  return {
    ocl: changed,
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode:
        kind === 'overstrict-positive-id' ? 'UNEXPECTED_REJECTION' : 'OBLIGATION_MISMATCH',
      expectedObligationId:
        kind === 'overstrict-positive-id' ? 'P01' : kind === 'wrong-result' ? 'Q02' : 'Q01',
      localizationNote:
        'The injected edit is known only to the harness. Actual diagnostic model references delimit the repair search scope, not a uniquely proven root cause.',
    },
  };
}
export async function verifyCocomeDeletionCandidate(
  ocl: DeletionOcl,
  operation: CocomeDeletionOperation
) {
  const spec = cocomeDeletionSpecifications[operation];
  verifyDevelopmentSources(developmentRegistry.require(spec.id));
  const settings = cocomeDeletionSettings(operation);
  const input = buildOperationInput(settings);
  const grounding = createOperationModelGrounding(settings);
  const parsed = parse(cocomeDeletionContract(ocl, operation));
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
  const report = await evaluateDevelopmentBehavior(code.entry, input.requirement, spec.id);
  return {
    preExecutionValid: true,
    report,
    repairDiagnostics: developmentRepairDiagnostics(report, grounding, ocl),
  };
}
