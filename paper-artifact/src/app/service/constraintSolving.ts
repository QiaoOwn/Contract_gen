import {createHash} from 'node:crypto';
import {z} from 'zod';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import type {OpenAIChatModelId} from '@langchain/openai';
import {generateStructuredJsonDetailed, StructuredJsonOutputError} from './generateOclWithJsonMode';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';
import {auditDirectedRepair, createRepairDirective, renderRepairDirective} from './directedRepair';
import {createG4Prompt} from './createG4Prompt';
import {createDefinitionPrompt} from './createDefinitionPrompt';
import {createGenerationRulesPrompt} from './createGenerationRulesPrompt';
import {generationMessageTrace} from './generationMessageTrace';
import {createOCLGenerationSystemPrompt} from './createOCLGenerationSystemPrompt';
import {
  constraintRepairContext,
  auditConstraintRepairScope,
  CONSTRAINT_SYNTAX_GUIDANCE,
} from './constraintRepair';
import {
  prepareConstraintGeneration,
  auditTaskEvidence,
  type ConstraintTaskPlan,
  type TaskSolutionIssue,
} from './constraintTaskPlan';

export const CONSTRAINT_SOLVER_PROMPT_VERSION = 'constraint-guided-ocl-solver-v3';
export const taskSolutionSchema = z
  .object({
    planHash: z.string(),
    contract: z
      .object({
        definition: z.string().max(64000).nullable(),
        precondition: z.string().trim().min(1).max(64000),
        postcondition: z.string().trim().min(1).max(64000),
      })
      .strict(),
    taskEvidence: z
      .array(
        z.object({taskId: z.string(), expression: z.string().trim().min(1).max(64000)}).strict()
      )
      .max(512),
  })
  .strict();

export const createConstraintSolvingSystemPrompt = () =>
  [
    'Solve the program-issued OCL requirement tasks using the supplied model. Construct expressions yourself; do not change the tasks, model, signature, rules or tests.',
    createG4Prompt(),
    createDefinitionPrompt(),
    createGenerationRulesPrompt(),
    CONSTRAINT_SYNTAX_GUIDANCE,
    'Return exactly JSON {planHash,contract:{definition,precondition,postcondition},taskEvidence:[{taskId,expression}]}. Use null for an unused definition. Do not return a Contract wrapper or additional keys.',
    'For every issued task provide one or more evidence expressions copied from its assigned contract clause. If one requirement has nonadjacent effects, use separate taskEvidence entries with the same taskId; never join nonadjacent expressions into fabricated evidence. Each expression must be an actual AST subtree or contiguous Boolean segment. Multiple tasks may share an expression when it actually implements their obligations. Evidence is checked against the parsed candidate; your assertion is not proof of semantic correctness.',
    'On repair return the full envelope, preserving all protected candidate regions and fixing only the authorized search scope. Unresolved source meaning must not be guessed.',
  ].join('\n\n');

export async function executeConstraintSolving(param: {
  plan: ConstraintTaskPlan;
  context: OperationModelGrounding;
  input: string;
  requirement: string;
  inputHash: string;
  model: OpenAIChatModelId;
  apiKey: string;
  baseURL: string;
  previous?: RepairCandidate;
  previousProposal?: unknown;
  diagnostics: RepairDiagnostic[];
}) {
  const preparation = prepareConstraintGeneration(param);
  const system = createConstraintSolvingSystemPrompt();
  const messages = [new SystemMessage(system), new HumanMessage(param.input)];
  const previousParsed = taskSolutionSchema.safeParse(param.previousProposal);
  const previousTaskEvidence = previousParsed.success ? previousParsed.data.taskEvidence : null;
  const repairContext =
    param.previous && param.diagnostics.length
      ? constraintRepairContext(param.previous, param.diagnostics, param.context)
      : null;
  if (param.previous && param.diagnostics.length) {
    const directive = createRepairDirective(
      param.previous,
      repairContext!.diagnostics,
      param.context
    );
    messages.push(
      new HumanMessage(
        JSON.stringify({
          previousCandidate: param.previous,
          previousTaskEvidence,
          diagnostics: repairContext!.diagnostics,
          repairContext: {...repairContext, diagnostics: undefined},
        })
      ),
      new HumanMessage(renderRepairDirective(directive)),
      new HumanMessage(
        repairContext!.mode === 'evidence-only'
          ? 'This is a task-evidence protocol repair only. Return definition, precondition and postcondition byte-for-byte unchanged. Inspect previousTaskEvidence and replace each rejected mapping with actual AST subexpressions. Use multiple entries with the same taskId for separate effects. Do not repeat an unchanged invalid mapping; business validation has not yet accepted this candidate.'
          : repairContext!.mode === 'syntax-clause-scoped'
            ? `Repair only syntax within ${repairContext!.allowedClauses!.join(', ')}. Copy all other clauses byte-for-byte unchanged. The parser coordinate identifies a search clause, not a uniquely proven cause. Preserve all requirement obligations.\n${CONSTRAINT_SYNTAX_GUIDANCE}`
            : 'Follow the diagnosed repair scope and preserve unaffected obligations.'
      )
    );
  }
  const trace = generationMessageTrace(String(param.model), messages);
  let generated;
  try {
    generated = await generateStructuredJsonDetailed({...param, messages, schema: z.unknown()});
  } catch (error) {
    if (!(error instanceof StructuredJsonOutputError)) throw error;
    generated = {value: {invalidModelResponse: error.content}, usage: error.usage};
  }
  const parsed = taskSolutionSchema.safeParse(generated.value);
  let issues: TaskSolutionIssue[] = [];
  let ocl: RepairCandidate = param.previous ?? {
    definition: '',
    precondition: 'false',
    postcondition: 'false',
  };
  let evidenceAudit: ReturnType<typeof auditTaskEvidence> | null = null;
  let scopeAudit: ReturnType<typeof auditDirectedRepair> | null = null;
  let repairScopeAudit: ReturnType<typeof auditConstraintRepairScope> | null = null;
  if (!parsed.success)
    issues.push({
      code: 'TASK_SOLUTION_SCHEMA',
      message: 'Return the required strict task-solution JSON envelope.',
    });
  else if (parsed.data.planHash !== param.plan.hash)
    issues.push({
      code: 'TASK_PLAN_IDENTITY',
      message: 'The solution belongs to another immutable task plan.',
    });
  else {
    ocl = {...parsed.data.contract, definition: parsed.data.contract.definition ?? ''};
    evidenceAudit = auditTaskEvidence(param.plan, ocl, parsed.data.taskEvidence, param.context);
    issues = evidenceAudit.issues;
    if (param.previous && repairContext) {
      scopeAudit = auditDirectedRepair(
        param.previous,
        ocl,
        param.context,
        repairContext.diagnostics
      );
      repairScopeAudit = auditConstraintRepairScope(param.previous, ocl, repairContext);
      if (repairScopeAudit.blocked)
        issues.push({
          code: 'TASK_REPAIR_SCOPE',
          message: `Repair changed protected clauses in ${repairContext.mode}: ${repairScopeAudit.outsideClauses.join(', ')}.`,
        });
      const evidenceKey = (items: typeof parsed.data.taskEvidence) => JSON.stringify(
        items.map(item => [item.taskId, item.expression]).sort((a, b) =>
          String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1]))
        )
      );
      if (repairContext.mode === 'evidence-only' && previousTaskEvidence &&
          issues.some(issue => issue.code === 'TASK_EVIDENCE_NOT_FOUND') &&
          ['definition', 'precondition', 'postcondition'].every(
            clause => ocl[clause as keyof RepairCandidate] === param.previous![clause as keyof RepairCandidate]
          ) && evidenceKey(parsed.data.taskEvidence) === evidenceKey(previousTaskEvidence))
        issues.push({
          code: 'TASK_EVIDENCE_UNCHANGED',
          message: 'Evidence-only repair repeated the same invalid task mapping. Stop this candidate without consuming further model calls.',
        });
    }
  }
  const base = createOCLGenerationSystemPrompt();
  return {
    ocl,
    issues,
    scopeAudit,
    trace,
    usage: generated.usage,
    audit: {
      version: CONSTRAINT_SOLVER_PROMPT_VERSION,
      preparation,
      planHash: param.plan.hash,
      requestMessagesHash: trace.messagesHash,
      proposal: generated.value,
      protocolAccepted: issues.length === 0 && !scopeAudit?.blocked,
      structuralTraceability: evidenceAudit?.structuralTraceability ?? 'unresolved',
      semanticStatus: 'requires-behavioral-evaluation',
      evidenceAudit,
      scopeAudit,
      repairScopeAudit,
      repairContext,
      ownership: 'program-owns-tasks-and-acceptance-model-solves-expressions',
      actualLlmCalls: 1,
    },
    promptMetadata: {
      version: CONSTRAINT_SOLVER_PROMPT_VERSION,
      hash: createHash('sha256').update(system).digest('hex'),
      basePromptVersion: base.version,
      basePromptHash: base.hash,
      generationConfigVersion: base.generationConfig.version,
      generationConfigHash: base.generationConfig.hash,
      generationGrammarVersion: base.components.grammar.version,
      generationGrammarHash: base.components.grammar.hash,
      generationRulesVersion: base.components.generationRules.version,
      generationRulesHash: base.components.generationRules.hash,
      outputMode: base.generationConfig.outputMode,
      temperature: base.generationConfig.temperature,
      maxTokens: base.generationConfig.maxTokens,
    },
  };
}
