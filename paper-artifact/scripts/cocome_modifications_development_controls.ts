import {ParserRuleContext, TerminalNode} from 'antlr4';
import {RuleAtomicExpressionContext, RuleLogicFormulaExpCSContext} from '../antlr4/REMODELParser';
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
  cocomeModificationSpecifications,
  type CocomeModificationOperation,
} from '../src/app/service/developmentBehavior/cocomeModificationsSpecification';

export type ModificationOcl = {definition: string; precondition: string; postcondition: string};
const project = {manageStore, manageProductCatalog, manageCashDesk, manageCashier, manageSupplier};
export type CocomeModificationControl =
  | 'missing-name'
  | 'missing-address'
  | 'missing-open-state'
  | 'wrong-result'
  | 'overstrict-positive-id';
export function cocomeModificationControlKinds(
  operation: CocomeModificationOperation
): CocomeModificationControl[] {
  const fields = cocomeModificationSpecifications[operation].fields;
  return [
    'missing-name',
    'wrong-result',
    'overstrict-positive-id',
    ...(fields.some((field) => field.attribute === 'Address') ? ['missing-address' as const] : []),
    ...(fields.some((field) => field.attribute === 'IsOpened')
      ? ['missing-open-state' as const]
      : []),
  ];
}
export const cocomeModificationSettings = (operation: CocomeModificationOperation) => ({
  project: 'CoCoME' as const,
  useCase: cocomeModificationSpecifications[operation].useCase,
  operation,
});
// Project clauses are functional fixtures, not independent references or model-generated results.
export const cocomeModificationFixture = (
  operation: CocomeModificationOperation
): ModificationOcl => {
  const spec = cocomeModificationSpecifications[operation];
  const source = project[spec.useCase].relatedService.operations.find(
    (item) => item.name === operation
  );
  if (!source) throw new Error(`Missing explicit source fixture for ${spec.id}`);
  return {
    definition: source.definition ?? '',
    precondition: source.precondition!,
    postcondition: source.postcondition!,
  };
};
export const cocomeModificationContract = (
  ocl: ModificationOcl,
  operation: CocomeModificationOperation
) => {
  const spec = cocomeModificationSpecifications[operation];
  return generateContractCode({
    serviceName: spec.service,
    operationName: operation,
    parameters: spec.fields.map((field) => ({name: field.parameter, type: field.type})),
    returnedType: 'Boolean',
    ...ocl,
  });
};
export function createCocomeModificationControl(
  ocl: ModificationOcl,
  operation: CocomeModificationOperation,
  kind: CocomeModificationControl
) {
  if (
    !Object.hasOwn(cocomeModificationSpecifications, operation) ||
    !cocomeModificationControlKinds(operation).includes(kind)
  )
    throw new Error('Control does not match the registered operation');
  const spec = cocomeModificationSpecifications[operation];
  const fieldName =
    kind === 'missing-name'
      ? 'Name'
      : kind === 'missing-address'
        ? 'Address'
        : kind === 'missing-open-state'
          ? 'IsOpened'
          : null;
  const field = spec.fields.find((item) => item.attribute === fieldName);
  const clause = kind === 'overstrict-positive-id' ? 'precondition' : 'postcondition';
  const contract = cocomeModificationContract(ocl, operation);
  const parsed = parse(contract);
  if (parsed.errors.length || !parsed.tree)
    throw new Error('Expected a parseable source candidate');
  const expression =
    clause === 'postcondition'
      ? parsed.tree.rulePostcondition().ruleOCLExpressionCS()
      : parsed.tree.rulePrecondition().ruleOCLExpressionCS();
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
      node.ruleInfixCompareOperatorName()?.getText() === '='
    ) {
      const left = node.ruleLeftSubAtomicExpression().getText();
      const right = node.ruleRightSubAtomicExpression();
      if (kind === 'wrong-result' && left === 'result' && right?.getText() === 'true')
        edit(right.start.start, right.stop!.stop + 1, 'false');
      if (field && left.endsWith(`.${field.attribute}`) && right?.getText() === field.parameter) {
        const parent = node.parentCtx;
        if (
          !(parent instanceof RuleLogicFormulaExpCSContext) ||
          parent.children?.some((child) => child.getText() === 'or')
        )
          throw new Error('Expected standalone conjunct');
        const children = parent.children ?? [];
        const index = children.indexOf(node);
        const previous = children[index - 1];
        const next = children[index + 1];
        if (previous instanceof TerminalNode && previous.getText() === 'and')
          edit(previous.symbol.start, node.stop!.stop + 1, '');
        else if (next instanceof TerminalNode && next.getText() === 'and')
          edit(node.start.start, next.symbol.stop + 1, '');
        else throw new Error('Expected adjacent and');
      }
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
  if (parse(cocomeModificationContract(changed, operation)).errors.length)
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
        kind === 'overstrict-positive-id'
          ? 'P01'
          : kind === 'wrong-result'
            ? spec.resultObligationId
            : field!.obligationId,
      localizationNote:
        'The injected edit is known to the harness, not disclosed separately to the agent. Evidence delimits clause-level search rather than proving a unique root cause.',
    },
  };
}
export async function verifyCocomeModificationCandidate(
  ocl: ModificationOcl,
  operation: CocomeModificationOperation
) {
  const spec = cocomeModificationSpecifications[operation];
  verifyDevelopmentSources(developmentRegistry.require(spec.id));
  const settings = cocomeModificationSettings(operation);
  const input = buildOperationInput(settings);
  const grounding = createOperationModelGrounding(settings);
  const parsed = parse(cocomeModificationContract(ocl, operation));
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
