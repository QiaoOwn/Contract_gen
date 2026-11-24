import {createHash} from 'node:crypto';
import type {OperationModelGrounding} from '../src/app/service/operationModelGrounding';
import {parseModelType} from '../src/app/service/modelIndex';
import type {
  PlanExpression,
  PlanSlot,
  SemanticContractPlan,
} from '../src/app/service/semanticContractPlan';
import {normalizePlanExpression} from '../src/app/service/planExpressions';
import {applyPlanCompletion, planCompletionSchema} from '../src/app/service/completeSemanticPlan';
import {planCompletionDiagnostics} from '../src/app/service/programOwnedGeneration';

export const CONTROL_FAULT_KINDS = [
  'literal-value',
  'operator',
  'missing-pre',
  'extra-pre',
  'same-type-feature',
  'enum-member',
] as const;
export type ControlFaultKind = (typeof CONTROL_FAULT_KINDS)[number];
const numeric = (type: string) => type === 'Integer' || type === 'Real';

// This checker is an experiment precondition, not an additional production OCL type system.
export function controlledExpressionType(
  expression: PlanExpression,
  plan: SemanticContractPlan,
  context: OperationModelGrounding,
  clause: PlanSlot['clause']
): string {
  const value = normalizePlanExpression(expression);
  const infer = (node: PlanExpression): string => {
    const variables = [
      ...context.index.operation.parameters,
      ...context.index.operation.serviceState,
      ...(context.index.operation.returnType ? [context.index.operation.returnType] : []),
    ];
    const feature = (id: string) => {
      const matches = context.index.entities
        .flatMap((entity) => entity.features)
        .filter((item) => item.id === id);
      if (matches.length !== 1)
        throw new Error('Feature must resolve uniquely in the read-only model');
      return matches[0];
    };
    if (node.kind === 'literal')
      return node.value === null
        ? 'null'
        : typeof node.value === 'boolean'
          ? 'Boolean'
          : Number.isInteger(node.value)
            ? 'Integer'
            : 'Real';
    if (node.kind === 'ref') {
      const variable = variables.find((item) => item.id === node.id);
      if (variable) return variable.type.raw;
      const binding = plan.program?.bindings.find((item) => item.id === node.id);
      if (binding) return binding.type;
      if (plan.selector && node.id === `${plan.operationId}/planned-binding/target`)
        return plan.selector.entityName;
      throw new Error('Unknown controlled expression binding');
    }
    if (node.kind === 'property') {
      const ownerType = parseModelType(infer(node.object));
      const owner = context.index.entities.find((item) => item.name === ownerType.name);
      const member = feature(node.featureId);
      if (ownerType.kind !== 'named' || !owner?.effectiveFeatureIds.includes(member.id))
        throw new Error('Feature is not available on this bound object');
      return member.type.raw;
    }
    if (node.kind === 'enumeration') {
      const type = feature(node.featureId).type;
      if (type.kind !== 'enum' || !type.literals?.includes(node.literal))
        throw new Error('Undeclared enum member');
      return type.raw;
    }
    if (node.kind === 'binary') {
      const left = infer(node.left),
        right = infer(node.right);
      if (node.op === '-' || node.op === '+' || node.op === '>') {
        if (!numeric(left) || !numeric(right))
          throw new Error('Numeric operator requires numeric operands');
        return node.op === '>'
          ? 'Boolean'
          : left === 'Real' || right === 'Real'
            ? 'Real'
            : 'Integer';
      }
      if (left !== right && !(numeric(left) && numeric(right)))
        throw new Error('Equality operands are incompatible');
      return 'Boolean';
    }
    const inner = infer(node.value);
    if (node.kind === 'pre') {
      if (clause !== 'postcondition')
        throw new Error('Pre-state reads are not allowed in preconditions');
      return inner;
    }
    if (node.kind === 'undefined') return 'Boolean';
    if (node.kind === 'not') {
      if (inner !== 'Boolean') throw new Error('Negation requires Boolean');
      return 'Boolean';
    }
    if (parseModelType(inner).kind !== 'set') throw new Error('Size requires a Set');
    return 'Integer';
  };
  return infer(value);
}

export function prepareRejectedSlotControl(
  plan: SemanticContractPlan,
  field: string | undefined,
  options: {faultKind?: ControlFaultKind; slotId?: string; context?: OperationModelGrounding} = {}
) {
  if (plan.status !== 'ready') throw new Error('A complete semantic plan is required');
  if (options.slotId && field) throw new Error('Specify target-field or target-slot, not both');
  const candidates = plan.slots.filter((slot) =>
    options.slotId
      ? slot.id === options.slotId
      : slot.clause === 'postcondition' &&
        plan.declarations.some(
          (item) => item.id === slot.targetFeatureId && item.name === (field ?? 'Name')
        )
  );
  if (candidates.length !== 1) throw new Error('The target must identify exactly one slot');
  const target = candidates[0];
  const faultKind = options.faultKind ?? 'literal-value';
  if (!CONTROL_FAULT_KINDS.includes(faultKind)) throw new Error('Unknown controlled fault kind');
  const goal = normalizePlanExpression(target.goal);
  let changed: PlanExpression;
  if (faultKind === 'literal-value') {
    changed = {
      kind: 'literal',
      value: goal.kind === 'literal' && typeof goal.value === 'boolean' ? !goal.value : false,
    };
  } else {
    const context = options.context;
    if (!context || context.index.operation.id !== plan.operationId)
      throw new Error('Fine-grained controls require the matching read-only model index');
    if (goal.kind !== 'binary') throw new Error('This fine-grained control requires a binary goal');
    if (faultKind === 'operator') {
      if (goal.op !== '-' && goal.op !== '+')
        throw new Error('Operator control requires numeric addition or subtraction');
      changed = {...goal, op: goal.op === '-' ? '+' : '-'};
    } else if (faultKind === 'missing-pre') {
      if (goal.left.kind !== 'pre')
        throw new Error('Missing-pre control requires a pre-state left operand');
      changed = {...goal, left: goal.left.value};
    } else if (faultKind === 'extra-pre') {
      if (goal.right.kind === 'pre')
        throw new Error('Extra-pre control requires a non-pre-state right operand');
      changed = {...goal, right: {kind: 'pre', value: goal.right}};
    } else if (faultKind === 'same-type-feature') {
      if (goal.right.kind !== 'property')
        throw new Error('Feature control requires a property on the right');
      const right = goal.right;
      const original = context.index.entities
        .flatMap((item) => item.features)
        .find((item) => item.id === right.featureId);
      if (!original) throw new Error('Original feature is not declared');
      const alternatives = context.index.entities
        .flatMap((item) => item.features)
        .filter(
          (item) =>
            item.owner === original.owner &&
            item.type.raw === original.type.raw &&
            item.id !== original.id &&
            target.allowedRefs.includes(item.id)
        );
      if (alternatives.length !== 1)
        throw new Error(
          'Same-type feature replacement must be unique and already allowed by the slot'
        );
      changed = {...goal, right: {...right, featureId: alternatives[0].id}};
    } else {
      if (goal.right.kind !== 'enumeration')
        throw new Error('Enum control requires an enumeration on the right');
      const right = goal.right;
      const member = context.index.entities
        .flatMap((item) => item.features)
        .find((item) => item.id === right.featureId);
      const alternatives = member?.type.literals?.filter((item) => item !== right.literal) ?? [];
      if (alternatives.length !== 1)
        throw new Error('Enum replacement must be a unique declared alternative');
      changed = {...goal, right: {...right, literal: alternatives[0]}};
    }
  }
  const expectedType = options.context
    ? controlledExpressionType(goal, plan, options.context, target.clause)
    : null;
  const submittedType = options.context
    ? controlledExpressionType(changed, plan, options.context, target.clause)
    : null;
  const typePreserving = expectedType !== null && expectedType === submittedType;
  if (faultKind !== 'literal-value' && (!typePreserving || expectedType !== target.expectedType))
    throw new Error('Fine-grained seed is not type-preserving and compatible with the target slot');
  const proposal = {
    planHash: plan.hash,
    slots: plan.slots.map((slot) => ({
      id: slot.id,
      expression: slot.id === target.id ? changed : slot.goal,
    })),
  };
  const applied = applyPlanCompletion(plan, {}, proposal);
  if (
    target.id in applied.accepted ||
    applied.issues.length !== 1 ||
    applied.issues[0].code !== 'SLOT_GOAL' ||
    applied.issues[0].slotId !== target.id ||
    Object.keys(applied.accepted).length !== plan.slots.length - 1
  )
    throw new Error('Controlled defect did not produce exactly one rejected slot');
  if (
    faultKind !== 'literal-value' &&
    (applied.issues[0].repairDirective?.unapprovedRefs.length ||
      applied.issues[0].repairDirective?.differences.length !== 1)
  )
    throw new Error(
      'Fine-grained seed must stay within allowed references and produce one localized difference'
    );
  return {
    provenance: 'synthetic-slot-defect-not-natural-model-output',
    syntheticSeedLlmCalls: 0,
    faultKind,
    typeAssessment: {
      role: 'experiment-precondition-not-business-equivalence-proof',
      expectedType,
      submittedType,
      typePreserving,
    },
    targetSlotId: target.id,
    targetField: field ?? null,
    proposal,
    originalTargetExpression: changed,
    allowedChangePaths: applied.issues[0].repairDirective?.allowedChangePaths ?? [],
    proposalSha256: createHash('sha256').update(JSON.stringify(proposal)).digest('hex'),
    accepted: applied.accepted,
    issues: applied.issues,
    diagnostics: planCompletionDiagnostics(plan, applied.issues),
  };
}

// A model can propose out-of-scope edits; this records them even if the production checker rejects them.
export function auditControlledProposal(
  seed: ReturnType<typeof prepareRejectedSlotControl>,
  raw: unknown
) {
  const parsed = planCompletionSchema.safeParse(raw);
  if (!parsed.success)
    return {status: 'invalid-schema', changedPaths: [], unauthorizedPaths: [], scopeValid: false};
  if (
    parsed.data.planHash !== seed.proposal.planHash ||
    parsed.data.slots.length !== 1 ||
    parsed.data.slots[0].id !== seed.targetSlotId
  )
    return {
      status: 'out-of-scope',
      changedPaths: [],
      unauthorizedPaths: ['(plan-or-slot-scope)'],
      scopeValid: false,
    };
  try {
    const before = normalizePlanExpression(seed.originalTargetExpression);
    const after = normalizePlanExpression(parsed.data.slots[0].expression);
    const changedPaths: string[] = [];
    const visit = (left: unknown, right: unknown, at: string) => {
      if (JSON.stringify(left) === JSON.stringify(right)) return;
      if (left && right && typeof left === 'object' && typeof right === 'object') {
        const a = left as Record<string, unknown>,
          b = right as Record<string, unknown>;
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
          visit(a[key], b[key], `${at}/${key}`);
      } else changedPaths.push(at);
    };
    visit(before, after, '');
    const unauthorizedPaths = changedPaths.filter(
      (at) =>
        !seed.allowedChangePaths.some(
          (allowed) => allowed === '' || at === allowed || at.startsWith(`${allowed}/`)
        )
    );
    return {
      status: unauthorizedPaths.length ? 'out-of-scope' : 'within-scope',
      changedPaths,
      unauthorizedPaths,
      scopeValid: unauthorizedPaths.length === 0,
    };
  } catch {
    return {
      status: 'invalid-expression',
      changedPaths: [],
      unauthorizedPaths: [],
      scopeValid: false,
    };
  }
}
