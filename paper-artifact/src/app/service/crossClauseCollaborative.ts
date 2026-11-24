import {HumanMessage, SystemMessage, type BaseMessage} from '@langchain/core/messages';
import {z} from 'zod';
import type {OpenAIChatModelId} from '@langchain/openai';
import {createConstraintSolvingSystemPrompt, executeConstraintSolving, taskSolutionSchema} from './constraintSolving';
import {auditTaskEvidence, prepareConstraintGeneration, type ConstraintTaskPlan, type TaskSolutionIssue} from './constraintTaskPlan';
import {generateStructuredJsonDetailed, StructuredJsonOutputError, type OclGenerationUsage} from './generateOclWithJsonMode';
import {constraintRepairContext, auditConstraintRepairScope, CONSTRAINT_SYNTAX_GUIDANCE} from './constraintRepair';
import {createRepairDirective, renderRepairDirective, auditDirectedRepair} from './directedRepair';
import {generationMessageTrace} from './generationMessageTrace';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';
import {assertCrossClausePackage, renderCrossClausePackage, type CrossClauseConstraintPackage} from './crossClauseConstraintCompiler';
import {checkCrossClauseAcceptance} from './crossClauseAcceptance';
import type {NarrativeGenerationIdentity} from './narrativeRequestIdentity';

export const CROSS_CLAUSE_SOLVER_VERSION = 'cross-clause-collaborative-solver-v1';
export type CollaborativeMode = 'constraintSolving' | 'crossClauseCollaborative';
type Parameters = {
  narrativeIdentity?: NarrativeGenerationIdentity;
  plan: ConstraintTaskPlan; context: OperationModelGrounding; input: string; requirement: string; inputHash: string;
  model: OpenAIChatModelId; apiKey: string; baseURL: string; diagnostics: RepairDiagnostic[];
  previous?: RepairCandidate; previousProposal?: unknown;
};
export type CollaborativeTransport = (request: {messages: BaseMessage[]}) => Promise<{value: unknown; usage: OclGenerationUsage}>;

export function prepareCollaborativeRequest(param: Parameters, pack: CrossClauseConstraintPackage) {
  const preparation = prepareConstraintGeneration(param);
  assertCrossClausePackage(pack, param.plan, param.context);
  const system = `${createConstraintSolvingSystemPrompt()}\n\n${CROSS_CLAUSE_SOLVER_VERSION}: jointly solve D/P/Q under immutable package K. Check shared declarations before references, choose types and temporal accesses consistently, and return the unchanged task-solution envelope. The program independently checks K; do not add coordination keys or assert semantic proof.`;
  const messages: BaseMessage[] = [new SystemMessage(system), new HumanMessage(param.input), new HumanMessage(renderCrossClausePackage(pack))];
  const previous = taskSolutionSchema.safeParse(param.previousProposal);
  const repairContext = param.previous && param.diagnostics.length ? constraintRepairContext(param.previous, param.diagnostics, param.context) : null;
  if (repairContext && param.previous) {
    const directive = createRepairDirective(param.previous, repairContext.diagnostics, param.context);
    messages.push(new HumanMessage(JSON.stringify({previousCandidate: param.previous,
      previousTaskEvidence: previous.success ? previous.data.taskEvidence : null,
      packageHash: pack.hash, diagnostics: repairContext.diagnostics, repairContext: {...repairContext, diagnostics: undefined}})),
    new HumanMessage(renderRepairDirective(directive)), new HumanMessage(repairContext.mode === 'evidence-only' ?
      'Repair task evidence only; preserve D/P/Q byte-for-byte.' : repairContext.mode === 'syntax-clause-scoped' ?
      `Repair syntax only in ${repairContext.allowedClauses!.join(', ')}. Preserve other clauses. ${CONSTRAINT_SYNTAX_GUIDANCE}` :
      'Return the complete envelope, repair the diagnosed candidate scope, preserve protected expressions, and re-satisfy immutable K. No dependency-impact edit expansion is authorized.'));
  }
  return {preparation, messages, repairContext, trace: generationMessageTrace(String(param.model), messages)};
}

export async function executeCrossClauseCollaborative(param: Parameters, pack: CrossClauseConstraintPackage,
  transport?: CollaborativeTransport) {
  const prepared = prepareCollaborativeRequest(param, pack);
  const start = performance.now();
  let response: {value: unknown; usage: OclGenerationUsage};
  try {
    response = transport ? await transport({messages: prepared.messages}) :
      await generateStructuredJsonDetailed({...param, messages: prepared.messages, schema: z.unknown()});
  } catch (error) {
    if (!(error instanceof StructuredJsonOutputError)) throw error;
    response = {value: {invalidModelResponse: error.content}, usage: error.usage};
  }
  // Recheck after the asynchronous model call; candidate responses never mutate K.
  assertCrossClausePackage(pack, param.plan, param.context);
  const parsed = taskSolutionSchema.safeParse(response.value);
  const issues: TaskSolutionIssue[] = [];
  let candidate = param.previous ?? {definition: '', precondition: 'false', postcondition: 'false'};
  let taskAudit: ReturnType<typeof auditTaskEvidence> | null = null;
  let scopeAudit: ReturnType<typeof auditDirectedRepair> | null = null;
  if (!parsed.success) issues.push({code: 'TASK_SOLUTION_SCHEMA', message: 'Return the strict task-solution envelope.'});
  else if (parsed.data.planHash !== param.plan.hash) issues.push({code: 'TASK_PLAN_IDENTITY', message: 'Return the immutable task-plan identity.'});
  else {
    candidate = {...parsed.data.contract, definition: parsed.data.contract.definition ?? ''};
    taskAudit = auditTaskEvidence(param.plan, candidate, parsed.data.taskEvidence, param.context);
    issues.push(...taskAudit.issues);
    if (param.previous && prepared.repairContext) {
      scopeAudit = auditDirectedRepair(param.previous, candidate, param.context, prepared.repairContext.diagnostics);
      const clauseAudit = auditConstraintRepairScope(param.previous, candidate, prepared.repairContext);
      if (scopeAudit.blocked || clauseAudit.blocked) issues.push({code: 'TASK_REPAIR_SCOPE', message: 'Repair changed protected candidate regions.'});
    }
  }
  const acceptance = parsed.success && parsed.data.planHash === param.plan.hash ?
    checkCrossClauseAcceptance({pack, plan: param.plan, context: param.context, candidate, taskEvidence: parsed.data.taskEvidence}) : null;
  return {candidate, proposal: response.value, issues, acceptance, scopeAudit, trace: prepared.trace,
    usage: response.usage, latencyMs: performance.now() - start, logicalModelCalls: 1,
    protocolAccepted: issues.length === 0, version: CROSS_CLAUSE_SOLVER_VERSION,
    packageHash: pack.hash, repairContext: prepared.repairContext};
}

// The legacy branch delegates byte-for-byte input to the existing implementation.
export async function solveOperationWithMode(param: Parameters, mode: CollaborativeMode = 'constraintSolving',
  pack?: CrossClauseConstraintPackage, transport?: CollaborativeTransport) {
  if (mode === 'constraintSolving') {
    if (transport) throw new Error('Legacy mode uses its existing transport; test injection is new-mode only');
    return {mode, result: await executeConstraintSolving(param)};
  }
  if (!pack) throw new Error('Collaborative mode requires program-compiled K');
  return {mode, result: await executeCrossClauseCollaborative(param, pack, transport)};
}
