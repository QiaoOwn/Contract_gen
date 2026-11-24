import {HumanMessage, type BaseMessage} from '@langchain/core/messages';
import {
  prepareCollaborativeRequest,
  executeCrossClauseCollaborative,
  type CollaborativeTransport,
} from './crossClauseCollaborative';
import {renderCrossClausePackage} from './crossClauseConstraintCompiler';
import {assertPackage25, renderPackage25, type Package25} from './crossClausePackage25';
import {extractDependencies25, impactDependencies25} from './crossClauseDependencies25';
import {generationMessageTrace} from './generationMessageTrace';
import {generateStructuredJsonDetailed} from './generateOclWithJsonMode';
import {taskSolutionSchema} from './constraintSolving';
import {checkCrossClauseAcceptance} from './crossClauseAcceptance';
import type {TaskEvidence} from './constraintTaskPlan';
import type {RepairCandidate} from './repairLocalization';
import {z} from 'zod';

type SolverParameters = Parameters<typeof prepareCollaborativeRequest>[0];
export function auditCollaborative25(
  param: {
    plan: SolverParameters['plan'];
    context: SolverParameters['context'];
    candidate: RepairCandidate;
    taskEvidence?: TaskEvidence[];
    previous?: RepairCandidate;
  },
  pack: Package25
) {
  assertPackage25(pack, param.plan, param.context);
  const current = extractDependencies25({...param, pack: pack.base});
  const previous = param.previous
    ? extractDependencies25({
        ...param,
        candidate: param.previous,
        taskEvidence: undefined,
        pack: pack.base,
      })
    : null;
  const impact = previous ? impactDependencies25(previous.graph, current.graph) : null;
  // Impact is a scheduling input: actually rerun the deterministic whole-contract
  // audit when trusted dependencies changed. Isolating clauses would lose scope.
  const recheck =
    impact?.changedNodes.length && current.graph.parsed
      ? checkCrossClauseAcceptance({
          pack: pack.base,
          plan: param.plan,
          context: param.context,
          candidate: param.candidate,
          taskEvidence: param.taskEvidence,
        })
      : null;
  if (impact && recheck) {
    impact.revalidation.performed = true;
    impact.revalidation.clauses = impact.affectedClauses;
    impact.revalidation.scope = 'impact-triggered-whole-candidate-deterministic-audit';
  }
  const decisions = pack.constraints.map((constraint) => {
    if (constraint.kind === 'shared-binding-identity') {
      const groups = current.graph.sharedBindings.filter(
        (binding) =>
          binding.usedByClauses.includes('precondition') &&
          binding.usedByClauses.includes('postcondition')
      );
      return {
        constraintId: constraint.id,
        kind: constraint.kind,
        status: groups.length ? ('satisfied' as const) : ('unresolved' as const),
        instances: groups,
        violations: [],
        meaning: 'same resolved lexical declaration only; not business identity',
      };
    }
    if (constraint.kind === 'temporal-consumer')
      return {
        constraintId: constraint.id,
        kind: constraint.kind,
        status: current.acceptance.decisions.find((item) => item.kind === 'temporal-scope')!.status,
        instances: current.graph.edges.filter((edge) => edge.kind === 'stateDependsOn'),
        violations: current.acceptance.audit.diagnostics.filter(
          (item) => item.code === 'CC-TEMPORAL' && item.status === 'conflict'
        ),
      };
    const clause = constraint.clauses[1];
    const instances = current.graph.sharedBindings.filter((binding) =>
      binding.usedByClauses.includes(clause as 'precondition' | 'postcondition')
    );
    const oldInstances =
      previous?.graph.sharedBindings.filter((binding) =>
        binding.usedByClauses.includes(clause as 'precondition' | 'postcondition')
      ) ?? [];
    const violations = current.acceptance.audit.diagnostics.filter((finding) => {
      if (
        finding.status !== 'conflict' ||
        finding.clause !== clause ||
        !finding.location ||
        !['CC-SCOPE', 'CC-TYPE'].includes(finding.code)
      )
        return false;
      const site = finding.location;
      const touchesUse = instances.some((binding) =>
        binding.uses.some(
          (use) =>
            use.clause === site.clause &&
            use.startOffset < site.endOffset &&
            use.endOffset > site.startOffset
        )
      );
      const lostReference =
        finding.underlyingCode === 'UNBOUND_VARIABLE' &&
        param.previous?.[clause as 'precondition' | 'postcondition'] ===
          param.candidate[clause as 'precondition' | 'postcondition'] &&
        oldInstances.some((binding) =>
          binding.uses.some(
            (use) => use.clause === site.clause && use.expression === site.expression
          )
        );
      return touchesUse || lostReference;
    });
    return {
      constraintId: constraint.id,
      kind: constraint.kind,
      status: violations.length
        ? ('violated' as const)
        : instances.length
          ? ('satisfied' as const)
          : ('unresolved' as const),
      instances,
      previousInstances: oldInstances,
      violations,
    };
  });
  const relationDiagnostics = decisions.flatMap((decision) =>
    decision.status === 'violated'
      ? current.acceptance.diagnostics
          .filter((item) =>
            decision.violations.some((finding) => item.msg.endsWith(finding.message))
          )
          .map((item) => ({
            ...item,
            code: `CC25_RELATION:${decision.kind}`,
            ruleIds: [...item.ruleIds, decision.constraintId],
          }))
      : []
  );
  return {
    version: 'cross-clause-audit-v25',
    graph: current.graph,
    decisions,
    baseAcceptance: current.acceptance,
    impact,
    revalidationExecution: recheck
      ? {
          candidateHash: recheck.candidateHash,
          requestedClauses: impact!.affectedClauses,
          checker: 'M1/M2 full deterministic scope/type/subset/task audit',
          blocked: recheck.blocked,
          decisions: recheck.decisions,
          diagnostics: recheck.audit.diagnostics,
        }
      : null,
    blocked:
      current.acceptance.blocked ||
      Boolean(recheck?.blocked) ||
      decisions.some((item) => item.status === 'violated'),
    diagnostics: [...current.acceptance.diagnostics, ...relationDiagnostics],
    revalidationPerformed: Boolean(impact?.revalidation.performed),
    mayEdit: [] as string[],
  };
}

export function prepareCollaborativeRequest25(
  param: SolverParameters,
  pack: Package25,
  enabled = true
) {
  const baseline = prepareCollaborativeRequest(param, pack.base);
  assertPackage25(pack, param.plan, param.context);
  if (!enabled) return {...baseline, enhancement: 'off' as const};
  const original = renderCrossClausePackage(pack.base);
  const messages: BaseMessage[] = baseline.messages.map((message) =>
    message.content === original ? new HumanMessage(renderPackage25(pack)) : message
  );
  if (messages.every((message, index) => message === baseline.messages[index]))
    throw new Error('Expected exactly one M2 package message to replace');
  return {
    ...baseline,
    messages,
    trace: generationMessageTrace(String(param.model), messages),
    enhancement: 'm25' as const,
  };
}

export async function executeCollaborative25(
  param: SolverParameters,
  pack: Package25,
  options: {enabled?: boolean; transport?: CollaborativeTransport; allowPaidCall?: boolean} = {}
) {
  const enabled = options.enabled ?? true;
  if (!options.transport && !options.allowPaidCall)
    throw new Error(
      'M25 defaults to zero-call; an explicit transport or paid authorization is required'
    );
  const prepared = prepareCollaborativeRequest25(param, pack, enabled);
  let sent = false;
  const result = await executeCrossClauseCollaborative(param, pack.base, async () => {
    sent = true;
    if (options.transport) return options.transport({messages: prepared.messages});
    return generateStructuredJsonDetailed({
      ...param,
      messages: prepared.messages,
      schema: z.unknown(),
    });
  });
  assertPackage25(pack, param.plan, param.context);
  const parsed = taskSolutionSchema.safeParse(result.proposal);
  const relational =
    enabled && parsed.success && parsed.data.planHash === param.plan.hash
      ? auditCollaborative25(
          {...param, candidate: result.candidate, taskEvidence: parsed.data.taskEvidence},
          pack
        )
      : null;
  return {
    ...result,
    trace: prepared.trace,
    enhancement: prepared.enhancement,
    package25Hash: pack.hash,
    relational,
    blocked:
      result.issues.length > 0 || (relational?.blocked ?? result.acceptance?.blocked ?? false),
    diagnostics: relational?.diagnostics ?? result.acceptance?.diagnostics ?? [],
    transportSent: sent,
  };
}
