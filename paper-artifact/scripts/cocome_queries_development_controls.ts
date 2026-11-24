import {ParserRuleContext} from 'antlr4';
import {RuleAtomicExpressionContext} from '../antlr4/REMODELParser';
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
  cocomeQuerySpecifications,
  type CocomeQueryOperation,
} from '../src/app/service/developmentBehavior/cocomeQueriesSpecification';

export type QueryOcl = {definition: string; precondition: string; postcondition: string};
const project = {manageStore, manageProductCatalog, manageCashDesk, manageCashier, manageSupplier};
export type CocomeQueryControl = 'wrong-object' | 'overstrict-positive-id';
export const cocomeQuerySettings = (operation: CocomeQueryOperation) => ({
  project: 'CoCoME' as const,
  useCase: cocomeQuerySpecifications[operation].useCase,
  operation,
});
// Existing project clauses are functional fixtures, not independently adjudicated references or LLM outcomes.
export const cocomeQueryFixture = (operation: CocomeQueryOperation): QueryOcl => {
  const spec = cocomeQuerySpecifications[operation];
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
export const cocomeQueryContract = (ocl: QueryOcl, operation: CocomeQueryOperation) =>
  generateContractCode({
    serviceName: cocomeQuerySpecifications[operation].service,
    operationName: operation,
    parameters: [{name: 'id', type: 'Integer'}],
    returnedType: cocomeQuerySpecifications[operation].entity,
    ...ocl,
  });
export function createCocomeQueryControl(
  ocl: QueryOcl,
  operation: CocomeQueryOperation,
  kind: CocomeQueryControl
) {
  if (
    !Object.hasOwn(cocomeQuerySpecifications, operation) ||
    !['wrong-object', 'overstrict-positive-id'].includes(kind)
  )
    throw new Error('Unknown query control or operation');
  const clause = kind === 'wrong-object' ? 'postcondition' : 'precondition';
  const contract = cocomeQueryContract(ocl, operation);
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
  const visit = (node: ParserRuleContext) => {
    if (
      kind === 'wrong-object' &&
      node instanceof RuleAtomicExpressionContext &&
      node.ruleLeftSubAtomicExpression().getText() === 'result' &&
      node.ruleInfixCompareOperatorName()?.getText() === '='
    ) {
      const right = node.ruleRightSubAtomicExpression();
      const start = right.start.start - offset;
      const end = right.stop!.stop + 1 - offset;
      if (start < 0 || end > original.length || start >= end)
        throw new Error('Out-of-clause mutation');
      const entity = cocomeQuerySpecifications[operation].entity;
      edits.push({
        start,
        end,
        before: original.slice(start, end),
        after: `${entity}.allInstances()->any(other:${entity} | other.Id <> id)`,
      });
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
  if (change.before === change.after) throw new Error('Control would not change the candidate');
  const changed = {
    ...ocl,
    [clause]: original.slice(0, change.start) + change.after + original.slice(change.end),
  };
  if (parse(cocomeQueryContract(changed, operation)).errors.length)
    throw new Error('Mutated contract does not parse');
  return {
    ocl: changed,
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode: kind === 'wrong-object' ? 'OBLIGATION_MISMATCH' : 'UNEXPECTED_REJECTION',
      expectedObligationId: kind === 'wrong-object' ? 'Q01' : 'P01',
      localizationNote:
        'The injected target is known to the harness only. Model dependencies and obligations define a clause-level search scope.',
    },
  };
}
export async function verifyCocomeQueryCandidate(ocl: QueryOcl, operation: CocomeQueryOperation) {
  const specification = cocomeQuerySpecifications[operation];
  verifyDevelopmentSources(developmentRegistry.require(specification.id));
  const settings = cocomeQuerySettings(operation);
  const input = buildOperationInput(settings);
  const grounding = createOperationModelGrounding(settings);
  const parsed = parse(cocomeQueryContract(ocl, operation));
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
