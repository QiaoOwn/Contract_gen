import {createHash} from 'node:crypto';
import type {OpenAIChatModelId} from '@langchain/openai';
import {
  applyPlanCompletion,
  createPlanCompletionMessages,
  generateSemanticPlanCompletion,
  type PlanCompletionIssue,
} from './completeSemanticPlan';
import {
  assertSemanticContractPlan,
  materializeSemanticContract,
  type SemanticContractPlan,
  type PlanExpression,
} from './semanticContractPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import {generationMessageTrace} from './generationMessageTrace';
import {classifyRepairDiagnostic} from './repairTaxonomy';
import type {RepairDiagnostic} from './repairDiagnostics';
import {repairGuardDiagnostic} from './repairGuards';

export async function executeProgramOwnedGeneration(param: {
  plan: SemanticContractPlan;
  context: OperationModelGrounding;
  mode: 'automatic' | 'model';
  accepted: Record<string, PlanExpression>;
  issues: PlanCompletionIssue[];
  model: OpenAIChatModelId;
  apiKey: string;
  baseURL: string;
}) {
  assertSemanticContractPlan(param.plan, param.context);
  let accepted = {...param.accepted};
  let issues: PlanCompletionIssue[] = [];
  let usage = {
    inputTokens: 0 as number | null,
    outputTokens: 0 as number | null,
    totalTokens: 0 as number | null,
    reasoningTokens: 0 as number | null,
    finishReason: 'program-compiled' as string | null,
  };
  let trace: ReturnType<typeof generationMessageTrace> | null = null;
  let rawProposal: unknown = null;
  let promptHash: string | null = null;
  if (param.mode === 'automatic')
    accepted = Object.fromEntries(param.plan.slots.map((slot) => [slot.id, slot.goal]));
  else {
    const messages = createPlanCompletionMessages(param.plan, accepted, param.issues);
    trace = generationMessageTrace(String(param.model), messages);
    promptHash = createHash('sha256').update(String(messages[0].content)).digest('hex');
    const generated = await generateSemanticPlanCompletion({...param, messages});
    usage = generated.usage;
    rawProposal = generated.value;
    const applied = applyPlanCompletion(param.plan, accepted, generated.value);
    accepted = applied.accepted;
    issues = applied.issues;
  }
  const complete = !issues.length && param.plan.slots.every((slot) => slot.id in accepted);
  // Observational only: this record is never passed back into completion messages.
  const proposalAudit = trace
    ? {
        schemaVersion: 'semantic-plan-proposal-audit-v1',
        provenance: 'model-response',
        representation: 'parsed-json-or-invalid-response-envelope',
        model: String(param.model),
        planHash: param.plan.hash,
        requestMessagesHash: trace.messagesHash,
        proposalCaptured: rawProposal !== undefined,
        proposal: rawProposal ?? null,
        proposalHash:
          rawProposal === undefined
            ? null
            : createHash('sha256').update(JSON.stringify(rawProposal)).digest('hex'),
        acceptedBefore: param.accepted,
        acceptedAfter: accepted,
        outcome: complete
          ? 'accepted'
          : Object.keys(accepted).length > Object.keys(param.accepted).length
            ? 'partial'
            : 'rejected',
        issues,
        slots: param.plan.slots
          .filter((slot) => !(slot.id in param.accepted))
          .map((slot) => {
            const submitted =
              rawProposal &&
              typeof rawProposal === 'object' &&
              'slots' in rawProposal &&
              Array.isArray(rawProposal.slots)
                ? rawProposal.slots.filter(
                    (item: unknown) =>
                      item && typeof item === 'object' && 'id' in item && item.id === slot.id
                  )
                : [];
            return {
              id: slot.id,
              targetFeatureId: slot.targetFeatureId ?? null,
              expectedType: slot.expectedType,
              expectedExpression: slot.goal,
              submitted,
              accepted: slot.id in accepted,
              issues: issues.filter((issue) => !issue.slotId || issue.slotId === slot.id),
            };
          }),
        usage,
      }
    : null;
  return {
    // Unfilled slots retain program goals for diagnostic rendering only; validation is blocked below.
    ocl: materializeSemanticContract(param.plan, accepted),
    accepted,
    issues,
    usage,
    trace,
    rawProposal,
    proposalAudit,
    execution: {
      version: 'program-owned-plan-execution-v1',
      planHash: param.plan.hash,
      mode: param.mode,
      actualLlmCalls: param.mode === 'model' ? 1 : 0,
      acceptedSlotCount: Object.keys(accepted).length,
      requiredSlotCount: param.plan.slots.length,
      complete,
      promptHash,
      ownership: 'program-owns-clauses-selectors-and-effect-targets' as const,
    },
  };
}

export const planCompletionDiagnostics = (
  plan: SemanticContractPlan,
  issues: PlanCompletionIssue[]
): RepairDiagnostic[] =>
  issues.map((issue) => {
    if (
      issue.repairDirective?.disposition === 'review-plan' ||
      (issue.code === 'SLOT_GOAL' && !issue.repairDirective)
    )
      return repairGuardDiagnostic('PLANNING_REVIEW_REQUIRED', issue.message);
    const slot = plan.slots.find((item) => item.id === issue.slotId);
    const ids = new Set([
      ...(slot?.allowedRefs ?? []),
      ...(slot?.targetFeatureId ? [slot.targetFeatureId] : []),
    ]);
    return {
      stage: 'model',
      classification: classifyRepairDiagnostic('model', 'PLAN_COMPLETION_REJECTED', {
        modelRule: true,
        modelDeclaration: ids.size > 0,
      }),
      category: 'model-structure',
      code: 'PLAN_COMPLETION_REJECTED',
      msg: `${issue.code}: ${issue.message}`,
      repairEligible: true,
      obligationIds: slot ? [slot.taskId] : [],
      ruleIds: slot?.ruleIds ?? ['SP-COMPLETE'],
      modelEvidence: plan.declarations
        .filter((item) => ids.has(item.id))
        .map((item) => ({
          id: item.id,
          declaration: `${item.name}: ${item.type}`,
          source: item.source,
        })),
      location: slot ? {resolution: 'clause-only', clause: slot.clause} : {resolution: 'unknown'},
      ...(issue.repairDirective
        ? {
            slotRepair: issue.repairDirective,
            expected: issue.repairDirective.expectedExpression,
            observed: issue.repairDirective.submittedExpression,
          }
        : {}),
      repair:
        issue.repairDirective?.instruction ??
        'Submit only remaining slot IDs with the immutable plan hash. Accepted slots and all fixed contract structure are owned by the program.',
    };
  });
