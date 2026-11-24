import {HumanMessage} from '@langchain/core/messages';
import {z} from 'zod';
import {prepareCollaborativeRequest25} from './crossClauseCollaborative25';
import {
  executeCrossClauseCollaborative,
  type CollaborativeTransport,
} from './crossClauseCollaborative';
import {assertPackage25, type Package25} from './crossClausePackage25';
import {planDependencyRepair, type RepairPermission} from './dependencyRepairPermissions';
import {auditDependencyRepair} from './dependencyRepairAudit';
import {taskSolutionSchema} from './constraintSolving';
import {generationMessageTrace} from './generationMessageTrace';
import {generateStructuredJsonDetailed, StructuredJsonOutputError} from './generateOclWithJsonMode';
import type {RepairCandidate} from './repairLocalization';
import type {TaskEvidence} from './constraintTaskPlan';
import {ccHash} from './crossClauseGraph';
import {permissionAst, astStructureHash} from './dependencyRepairAst';
import type {RepairDiagnostic} from './repairDiagnostics';
import {taskSolutionDiagnostics, prepareConstraintGeneration} from './constraintTaskPlan';
import {validateDependencyRepairPreExec} from './dependencyRepairValidation';
import {repairPermissionInstruction} from './repairPermissionInstruction';

type SolverParams = Parameters<typeof prepareCollaborativeRequest25>[0];
export function dependencyRepairMessages(
  param: SolverParams,
  pack: Package25,
  permission: RepairPermission
) {
  const prepared = prepareCollaborativeRequest25(
    {...param, previous: undefined, previousProposal: undefined, diagnostics: []},
    pack
  );
  const {
    beforeAst: _beforeAst,
    protected: protectedRegions,
    alternatives: _alternatives,
    ...directive
  } = permission;
  const messages = [
    ...prepared.messages,
    new HumanMessage(
      JSON.stringify({
        previousCandidate: param.previous,
        previousProposal: param.previousProposal,
        dependencyRepairDirective: {
          ...directive,
          protected: protectedRegions.map(({id, clause, path, beforeHash, reason}) => ({
            id,
            clause,
            path,
            beforeHash,
            reason,
          })),
        },
      })
    ),
    new HumanMessage(
      'Return one complete unchanged-schema task-solution envelope. '+repairPermissionInstruction(permission)+' Do not change T, model, K or tests. Unresolved root causes do not authorize changes.'
    ),
  ];
  return {messages, trace: generationMessageTrace(String(param.model), messages)};
}
export const ordinaryMatchedRepairMessages = (param: SolverParams, pack: Package25) =>
  prepareCollaborativeRequest25(param, pack, true);
const syntaxHash = (candidate: RepairCandidate, param: SolverParams) => {
  const ast = permissionAst(candidate, param.context);
  return ast.parsed
    ? ccHash(Object.values(ast.roots).map((root) => astStructureHash(root)))
    : ccHash(candidate);
};

export async function runDependencyRepair(
  param: SolverParams & {
    initialCandidate: RepairCandidate;
    initialEvidence?: TaskEvidence[];
    previousCandidate?: RepairCandidate;
    maxAttempts: number;
    consumedAttempts?: number;
    optionId?: string;
    initialValidatorDiagnostics?: RepairDiagnostic[];
  },
  pack: Package25,
  options: {
    enabled?: boolean;
    transport?: CollaborativeTransport;
    allowPaidCall?: boolean;
    matchedComparison?: boolean;
    evaluateTerminal?: (candidate: RepairCandidate) => Promise<unknown>;
    validate?: (
      candidate: RepairCandidate,
      evidence: TaskEvidence[]
    ) => Promise<{
      preexecValid: boolean;
      diagnostics: RepairDiagnostic[];
      terminalEvidence: unknown;
    }>;
  } = {}
) {
  if (!Number.isInteger(param.maxAttempts) || param.maxAttempts < 1 || param.maxAttempts > 5)
    throw new Error('M3 budget must be 1..5');
  const consumed = param.consumedAttempts ?? 0;
  if (!Number.isInteger(consumed) || consumed < 0 || consumed > param.maxAttempts)
    throw new Error('Invalid prior attempt count');
  const remainingAttempts = param.maxAttempts - consumed;
  if (!options.transport && !options.allowPaidCall)
    throw new Error('M3 has no default paid model permission');
  const enabled = options.enabled ?? true;
  const immutableInputHash = ccHash({
    plan: param.plan,
    context: param.context,
    input: param.input,
    requirement: param.requirement,
    inputHash: param.inputHash,
    pack,
    narrativeIdentity: param.narrativeIdentity,
  });
  const assertInputs = () => {
    if (
      immutableInputHash !==
      ccHash({
        plan: param.plan,
        context: param.context,
        input: param.input,
        requirement: param.requirement,
        inputHash: param.inputHash,
        pack,
        narrativeIdentity: param.narrativeIdentity,
      })
    )
      throw new Error('Immutable M3 task/model/input changed');
    prepareConstraintGeneration(param);
    assertPackage25(pack, param.plan, param.context);
  };
  const validate =
    options.validate ??
    ((candidate: RepairCandidate, evidence: TaskEvidence[]) =>
      validateDependencyRepairPreExec(candidate, evidence, param.plan, param.context));
  if (!enabled) {
    let candidate = param.initialCandidate;
    let proposal: unknown = {
      planHash: param.plan.hash,
      contract: candidate,
      taskEvidence: param.initialEvidence ?? [],
    };
    const {checkCrossClauseAcceptance} = await import('./crossClauseAcceptance');
    let diagnostics = checkCrossClauseAcceptance({
      pack: pack.base,
      plan: param.plan,
      context: param.context,
      candidate,
      taskEvidence: param.initialEvidence,
    }).diagnostics;
    const events = [];
    let stop = 'budget-exhausted';
    for (let attempt = 1; attempt <= remainingAttempts; attempt++) {
      const current = {...param, previous: candidate, previousProposal: proposal, diagnostics};
      const matched = options.matchedComparison
        ? ordinaryMatchedRepairMessages(current, pack)
        : null;
      const transport: CollaborativeTransport | undefined = matched
        ? async () =>
            options.transport
              ? options.transport({messages: matched.messages})
              : generateStructuredJsonDetailed({
                  ...param,
                  messages: matched.messages,
                  schema: z.unknown(),
                })
        : options.transport;
      const ordinary = await executeCrossClauseCollaborative(current, pack.base, transport);
      const parsed = taskSolutionSchema.safeParse(ordinary.proposal);
      const validation =
        ordinary.issues.length === 0 && !ordinary.acceptance?.blocked && parsed.success
          ? await validate(ordinary.candidate, parsed.data.taskEvidence)
          : null;
      const terminalEvidence =
        validation?.preexecValid && options.evaluateTerminal
          ? await options.evaluateTerminal(ordinary.candidate)
          : null;
      events.push({
        attempt,
        requestTrace: matched?.trace ?? ordinary.trace,
        candidate: ordinary.candidate,
        usage: ordinary.usage,
        latencyMs: ordinary.latencyMs,
        issues: ordinary.issues,
        scopeAudit: ordinary.scopeAudit,
        ordinaryMode: true,
        validation,
        terminalEvidence,
      });
      candidate = ordinary.candidate;
      proposal = ordinary.proposal;
      if (validation?.preexecValid) {
        stop = 'preexec-valid-terminal';
        break;
      }
      diagnostics = [
        ...taskSolutionDiagnostics(param.plan, ordinary.issues),
        ...(ordinary.acceptance?.diagnostics ?? []),
        ...(validation?.diagnostics ?? []),
      ];
      if (!diagnostics.length || diagnostics.some((item) => !item.repairEligible)) {
        stop = 'ordinary-validation-stop';
        break;
      }
    }
    return {
      version: 'dependency-repair-loop-v1',
      enabled: false,
      stop,
      candidate,
      events,
      logicalModelCalls: events.length,
      consumedAttempts: consumed,
      totalLogicalModelCalls: consumed + events.length,
      providerRetryAttemptsObservable: false,
      semanticScope: 'unmodified M2 generation/scope checks; no M3 permission gate',
    };
  }
  let candidate = param.initialCandidate,
    previous = param.previousCandidate,
    evidence = param.initialEvidence;
  let proposal: unknown = {
    planHash: param.plan.hash,
    contract: candidate,
    taskEvidence: evidence ?? [],
  };
  const events: unknown[] = [],
    seen = new Set([syntaxHash(candidate, param)]);
  let stagnant = 0;
  let validatorDiagnostics: RepairDiagnostic[] = param.initialValidatorDiagnostics ?? [];
  let stop = 'budget-exhausted';
  const cleared = new Set<string>();
  let lastCodes: string[] = [];
  for (let attempt = 1; attempt <= remainingAttempts; attempt++) {
    assertInputs();
    const permissionInput = {
      plan: param.plan,
      context: param.context,
      pack,
      candidate,
      previous,
      taskEvidence: evidence,
      optionId: attempt === 1 ? param.optionId : undefined,
      validatorDiagnostics,
    };
    const permission = planDependencyRepair(permissionInput);
    if (attempt === 1)
      lastCodes = [
        ...new Set(
          permission.diagnostics.map((item) => `${item.code}:${item.location.clause ?? ''}`)
        ),
      ];
    if (enabled && permission.mode === 'unresolved') {
      stop = permission.diagnostics.length ? 'unresolved-permission' : 'no-repair-needed';
      break;
    }
    const params = {
      ...param,
      previous: candidate,
      previousProposal: proposal,
      diagnostics: permission.diagnostics,
    };
    const request = enabled ? dependencyRepairMessages(params, pack, permission) : null;
    const start = performance.now();
    let response: {value: unknown; usage: unknown};
    let trace;
    {
      trace = request!.trace;
      try {
        response = options.transport
          ? await options.transport({messages: request!.messages})
          : await generateStructuredJsonDetailed({
              ...param,
              messages: request!.messages,
              schema: z.unknown(),
            });
      } catch (error) {
        if (!(error instanceof StructuredJsonOutputError)) {
          events.push({
            attempt,
            permission,
            requestTrace: trace,
            status: 'infrastructure-error',
            responseObserved: false,
            error: (error instanceof Error ? error.message : String(error)).replaceAll(
              param.apiKey,
              '[redacted]'
            ),
            latencyMs: performance.now() - start,
          });
          stop = 'infrastructure-error';
          break;
        }
        response = {value: {invalidModelResponse: error.content}, usage: error.usage};
      }
    }
    assertInputs();
    const parsed = taskSolutionSchema.safeParse(response.value);
    if (!parsed.success || parsed.data.planHash !== param.plan.hash) {
      events.push({
        attempt,
        permission,
        requestTrace: trace,
        proposal: response.value,
        usage: response.usage,
        latencyMs: performance.now() - start,
        status: 'protocol-rejected',
      });
      stop = 'protocol-rejected';
      break;
    }
    const revised = {...parsed.data.contract, definition: parsed.data.contract.definition ?? ''};
    const audit = auditDependencyRepair(
      permission,
      permissionInput,
      revised,
      parsed.data.taskEvidence
    );
    const codes = [
      ...new Set(
        audit.crossClause.diagnostics.map((item) => `${item.code}:${item.location.clause ?? ''}`)
      ),
    ];
    const introducedDiagnosticFamilies = codes.filter((code) => !lastCodes.includes(code));
    for (const code of lastCodes) if (!codes.includes(code)) cleared.add(code);
    const reintroduced = codes.filter((code) => cleared.has(code));
    lastCodes = codes;
    const validation = !audit.blocked ? await validate(revised, parsed.data.taskEvidence) : null;
    const terminalEvidence =
      validation?.preexecValid && options.evaluateTerminal
        ? await options.evaluateTerminal(revised)
        : null;
    events.push({
      attempt,
      permission,
      requestTrace: trace,
      proposal: response.value,
      candidate: revised,
      usage: response.usage,
      latencyMs: performance.now() - start,
      audit,
      reintroduced,
      introducedDiagnosticFamilies,
      validation,
      terminalEvidence,
      ordinaryMode: !enabled,
      status: audit.permissionPassed ? 'authorized-edit' : 'permission-rejected',
    });
    if (validation?.preexecValid) {
      candidate = revised;
      stop = 'preexec-valid-terminal';
      break;
    }
    const key = syntaxHash(revised, param);
    const unchanged = key === syntaxHash(candidate, param);
    stagnant = unchanged ? stagnant + 1 : 0;
    if (stagnant >= 2) {
      stop = 'stagnation';
      break;
    }
    if (seen.has(key) && !unchanged) {
      stop = 'cycle-detected';
      break;
    }
    seen.add(key);
    if (!audit.permissionPassed) {
      stop = 'permission-rejected';
      break;
    }
    validatorDiagnostics = validation?.diagnostics ?? [];
    previous = candidate;
    candidate = revised;
    evidence = parsed.data.taskEvidence;
    proposal = parsed.data;
  }
  return {
    version: 'dependency-repair-loop-v1',
    enabled,
    stop,
    candidate,
    events,
    logicalModelCalls: events.length,
    consumedAttempts: consumed,
    totalLogicalModelCalls: consumed + events.length,
    providerRetryAttemptsObservable: false,
    semanticScope: 'deterministic permissions; model/behavioral evaluation recorded separately',
  };
}
