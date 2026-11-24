import {taskSolutionSchema} from '../../src/app/service/constraintSolving';
import {auditTaskEvidence} from '../../src/app/service/constraintTaskPlan';
import {permissionAst} from '../../src/app/service/dependencyRepairAst';
import {parse} from '../../src/app/util';
import {validateGeneratedContractSemantics} from '../../src/app/service/validateGeneratedContractSemantics';
import {validateModelGroundedContract} from '../../src/app/service/validateModelGroundedContract';
import {createEntryCode} from '../../src/app/service/createEntryCode';
import {parseTypescriptEntry} from '../../src/app/service/parseTypescriptEntry';
import {auditCollaborative25} from '../../src/app/service/crossClauseCollaborative25';
import {loadCollaborativeOperation, validateSeededCollaborativeCandidate} from '../../src/app/service/crossClauseOperation';
import type {NaturalCase} from './m43GenerationRequests';

// Evaluation-only links, derived from inspected Oracle assertions, never generation constraints.
export const scenarioLinks: Record<string, Record<string, string[]>> = {
  CoCoME_manageStore_queryStore: {
    P1: ['returns the target identity', 'accepts an existing', 'rejects a missing identifier'],
    Q1: ['returns the target identity', 'accepts an existing'],
  },
  LoanProcessingSystem_loanPayment_loanPayment: {
    P1: ['Happy Path', 'subtracts the loan RepaymentAmount', 'rejects a found Loan', 'rejects when precondition'],
    Q1: ['Happy Path', 'subtracts the loan RepaymentAmount'], Q2: ['Happy Path', 'subtracts the loan RepaymentAmount'],
  },
  CoCoME_processSale_enterItem: {
    P1: ['stores exactly one', 'accepts quantity equal', 'rejects absent sale'],
    P2: ['stores exactly one', 'accepts quantity equal', 'rejects absent sale'],
    P3: ['rejects quantity above', 'accepts quantity equal'],
    Q1: ['stores exactly one', 'accepts quantity equal'], Q2: ['stores exactly one', 'accepts quantity equal'],
    Q3: ['stores exactly one', 'accepts quantity equal'], Q4: ['stores exactly one', 'accepts quantity equal'],
  },
};
type Assertion = {title: string; fullName?: string; status: string};
export function scenarioCoverage(item: NaturalCase, assertions: Assertion[] | null) {
  return item.params.plan.tasks.map(task => {
    const selectors = scenarioLinks[item.operationId]?.[task.id.split('/').at(-1)!] ?? [];
    const matched = assertions?.filter(assertion => selectors.some(text => assertion.title.includes(text))) ?? [];
    const allSelectorsFound = selectors.length > 0 && selectors.every(text => matched.some(test => test.title.includes(text)));
    return {taskId: task.id, clause: task.clause, requirement: task.requirement, sourceLine: task.requirementLine,
      status: assertions === null ? 'not-evaluated' : allSelectorsFound && matched.every(test => test.status === 'passed')
        ? 'supported-on-frozen-scenarios' : 'unresolved',
      matchedAssertions: matched.map(({title, status}) => ({title, status})),
      meaning: 'finite behavioral support, not complete NL entailment; shared-test failures do not localize a failed obligation'};
  });
}

// No mode argument: B and C receive precisely the same external metrics.
export async function evaluateNaturalProposal(item: NaturalCase, proposal: unknown, behavior = false) {
  const decoded = taskSolutionSchema.safeParse(proposal);
  const protocolValid = decoded.success && decoded.data.planHash === item.params.plan.hash;
  const empty = {protocolValid, syntaxValid: null, subsetValid: null, modelTypeValid: null, preexecValid: null,
    diagnostics: [] as unknown[], crossClause: null as ReturnType<typeof auditCollaborative25> | null,
    deterministicCrossClause: null as {violations: unknown[]; unresolved: unknown[]} | null,
    taskEvidence: null as ReturnType<typeof auditTaskEvidence> | null, ast: null as ReturnType<typeof permissionAst> | null,
    generatedTypeScript: null as string | null, behavioral: null as unknown, behaviorStatus: 'not-evaluated',
    obligationScenarios: scenarioCoverage(item, null), fullSemanticCoverage: 'unresolved', repairCalls: 0};
  if (!decoded.success) return {...empty, protocolErrors: decoded.error.issues};
  // A wrong plan hash is a protocol violation, not evidence that the contract is syntactically invalid.
  const candidate = {...decoded.data.contract, definition: decoded.data.contract.definition ?? ''};
  const ast = permissionAst(candidate, item.params.context), parsed = parse(ast.contract);
  const syntaxValid = Boolean(parsed.tree && parsed.errors.length === 0);
  const subset = syntaxValid ? validateGeneratedContractSemantics({tree: parsed.tree!, hasReturnValue: Boolean(item.params.context.index.operation.returnType)}) : null;
  const model = syntaxValid ? validateModelGroundedContract({tree: parsed.tree!, context: item.params.context}) : null;
  const taskEvidence = auditTaskEvidence(item.params.plan, candidate, decoded.data.taskEvidence, item.params.context);
  const crossClause = auditCollaborative25({plan: item.params.plan, context: item.params.context, candidate, taskEvidence: decoded.data.taskEvidence}, item.pack);
  const diagnostics: unknown[] = [...parsed.errors, ...(subset ?? []), ...(model?.diagnostics ?? [])];
  let generatedTypeScript: string | null = null;
  let preexecValid = false;
  if (syntaxValid && subset?.length === 0 && model?.diagnostics.length === 0) {
    try {
      const code = await createEntryCode({project: item.params.context.index.project as never,
        useCase: item.params.context.index.useCase as never, operation: item.params.context.index.operation.name, ocl: candidate});
      generatedTypeScript = code.entry;
      const errors = parseTypescriptEntry(code.entry); diagnostics.push(...errors); preexecValid = errors.length === 0;
    } catch (error) {diagnostics.push({phase: 'lowering', message: String(error)});}
  }
  let behavioral: unknown = null, assertions: Assertion[] | null = null;
  let behaviorStatus = 'not-evaluated';
  if (behavior && preexecValid) {
    try {
      // Seeded evaluation bypasses generation. generationCount=maxAttempts=1; no retry path is available.
      const result = await validateSeededCollaborativeCandidate(loadCollaborativeOperation(item.operationId), candidate, [], 'gpt-5.5', 'unused-no-generation');
      const terminal = result.events.find(event => typeof event === 'object' && event !== null && 'Test Result' in event) as
        {'Test Result': {result: {assertionResults: Assertion[]; numPassingTests: number; numFailingTests: number; message: string}}} | undefined;
      behavioral = {terminalEvidence: result.terminalEvidence, backendDiagnostics: result.diagnostics, result: terminal?.['Test Result'].result ?? null};
      assertions = terminal?.['Test Result'].result.assertionResults ?? null;
      behaviorStatus = result.terminalEvidence?.hiddenPassed === true ? 'passed' : result.terminalEvidence ? 'failed' : 'evaluation-infrastructure-error';
    } catch (error) {behaviorStatus = 'evaluation-infrastructure-error'; behavioral = {error: String(error)};}
  }
  return {...empty, protocolValid, candidate, syntaxValid, subsetValid: subset === null ? null : subset.length === 0,
    modelTypeValid: model === null ? null : model.diagnostics.length === 0, preexecValid, diagnostics,
    taskEvidence, crossClause, deterministicCrossClause: {
      violations: crossClause.baseAcceptance.audit.diagnostics.filter(finding => finding.status === 'conflict'),
      unresolved: crossClause.baseAcceptance.audit.diagnostics.filter(finding => finding.status === 'unresolved'),
    }, ast, generatedTypeScript, behavioral, behaviorStatus,
    obligationScenarios: scenarioCoverage(item, assertions)};
}
