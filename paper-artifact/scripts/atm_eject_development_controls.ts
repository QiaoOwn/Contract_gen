import {ParserRuleContext, TerminalNode} from 'antlr4';
import {RuleAtomicExpressionContext, RuleLogicFormulaExpCSContext} from '../antlr4/REMODELParser';
import {generateContractCode, parse} from '../src/app/util';
import checkBalance from '../src/rm2pt/project/AutomatedTellerMachine/checkBalance';
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
import {ATM_EJECT_CARD_ID} from '../src/app/service/developmentBehavior/atmEjectCardSpecification';

export const atmEjectSettings = {
  project: 'AutomatedTellerMachine' as const,
  useCase: 'checkBalance' as const,
  operation: 'ejectCard',
};
const operation = checkBalance.relatedService.operations.find((item) => item.name === 'ejectCard')!;
// A source-provided functional fixture, not a generated outcome or independent ground truth.
export const atmEjectFixture = {
  definition: operation.definition ?? '',
  precondition: operation.precondition!,
  postcondition: operation.postcondition!,
};
export type AtmEjectControl = 'missing-password-reset' | 'wrong-result' | 'overstrict-precondition';
type Ocl = typeof atmEjectFixture;

export function createAtmEjectControl(ocl: Ocl, kind: AtmEjectControl) {
  if (!['missing-password-reset', 'wrong-result', 'overstrict-precondition'].includes(kind))
    throw new Error('Unsupported ATM control');
  const clause = kind === 'overstrict-precondition' ? 'precondition' : 'postcondition';
  const original = ocl[clause];
  const prefix = `Contract AutomatedTellerMachineSystem::ejectCard():Boolean { ${clause === 'precondition' ? 'precondition' : 'precondition: true postcondition'}:\n`;
  const suffix = clause === 'precondition' ? '\npostcondition: result = true\n}' : '\n}';
  const parsed = parse(prefix + original + suffix);
  if (parsed.errors.length || !parsed.tree) throw new Error('Expected a parseable source fixture');
  const edits: {start: number; end: number; before: string; after: string}[] = [];
  const addEdit = (start: number, end: number, after: string) => {
    start -= prefix.length;
    end -= prefix.length;
    if (start < 0 || end > original.length || start >= end) throw new Error('Out-of-clause edit');
    edits.push({start, end, before: original.slice(start, end), after});
  };
  const visit = (node: ParserRuleContext) => {
    if (node instanceof RuleAtomicExpressionContext) {
      if (kind === 'missing-password-reset' && node.getText() === 'self.PasswordValidated=false') {
        const parent = node.parentCtx;
        if (
          !(parent instanceof RuleLogicFormulaExpCSContext) ||
          parent.children?.some((item) => item.getText() === 'or')
        )
          throw new Error('Expected a standalone conjunct');
        const children = parent.children ?? [];
        const index = children.indexOf(node);
        const previous = children[index - 1];
        const next = children[index + 1];
        if (previous instanceof TerminalNode && previous.getText() === 'and')
          addEdit(previous.symbol.start, node.stop!.stop + 1, '');
        else if (next instanceof TerminalNode && next.getText() === 'and')
          addEdit(node.start.start, next.symbol.stop + 1, '');
        else throw new Error('Expected an adjacent and');
      }
      if (kind === 'wrong-result' && node.getText() === 'result=true') {
        const value = node.ruleRightSubAtomicExpression();
        addEdit(value.start.start, value.stop!.stop + 1, 'false');
      }
    }
    for (const child of node.children ?? []) if (child instanceof ParserRuleContext) visit(child);
  };
  visit(parsed.tree);
  if (kind === 'overstrict-precondition') {
    const conjunction = parsed.tree
      .rulePrecondition()
      .ruleOCLExpressionCS()
      .ruleLogicFormulaExpCS();
    if (!conjunction || conjunction.children?.some((child) => child.getText() === 'or'))
      throw new Error('Overstrict control requires a conjunction-only source precondition');
    edits.push({
      start: 0,
      end: original.length,
      before: original,
      after: `${original.trim()} and self.IsWithdraw = true`,
    });
  }
  if (edits.length !== 1)
    throw new Error(`Expected exactly one controlled edit, found ${edits.length}`);
  const edit = edits[0];
  const changed = original.slice(0, edit.start) + edit.after + original.slice(edit.end);
  if (parse(prefix + changed + suffix).errors.length) throw new Error('Control no longer parses');
  return {
    ocl: {...ocl, [clause]: changed},
    mutation: {
      role: 'synthetic-functional-control',
      kind,
      clause,
      edits,
      expectedCode:
        kind === 'overstrict-precondition' ? 'UNEXPECTED_REJECTION' : 'OBLIGATION_MISMATCH',
      expectedObligationIds:
        kind === 'missing-password-reset'
          ? ['Q02']
          : kind === 'wrong-result'
            ? ['Q08']
            : ['P01', 'P02', 'P03'],
      localizationNote:
        kind === 'overstrict-precondition'
          ? 'P01-P03 are an eligibility search scope, not a proven faulty source condition.'
          : 'The injected target is known to the control harness, not supplied separately to the repair agent.',
    },
  };
}

export async function verifyAtmEjectCandidate(ocl: Ocl) {
  verifyDevelopmentSources(developmentRegistry.require(ATM_EJECT_CARD_ID));
  const input = buildOperationInput(atmEjectSettings);
  const grounding = createOperationModelGrounding(atmEjectSettings);
  const parsed = parse(
    generateContractCode({
      serviceName: 'AutomatedTellerMachineSystem',
      operationName: 'ejectCard',
      parameters: [],
      returnedType: 'Boolean',
      ...ocl,
    })
  );
  if (parsed.errors.length || !parsed.tree) throw new Error('Candidate did not parse');
  const errors = [
    ...validateGeneratedContractSemantics({tree: parsed.tree, hasReturnValue: true}),
    ...validateModelGroundedContract({tree: parsed.tree, context: grounding}).diagnostics,
  ];
  if (errors.length)
    throw new Error(`Candidate static validation failed: ${JSON.stringify(errors)}`);
  const code = await createEntryCode({...atmEjectSettings, ocl});
  const compilation = parseTypescriptEntry(code.entry);
  if (compilation.length)
    throw new Error(`Candidate compilation failed: ${JSON.stringify(compilation)}`);
  const report = await evaluateDevelopmentBehavior(
    code.entry,
    input.requirement,
    ATM_EJECT_CARD_ID
  );
  return {
    preExecutionValid: true,
    report,
    repairDiagnostics: developmentRepairDiagnostics(report, grounding, ocl),
  };
}
