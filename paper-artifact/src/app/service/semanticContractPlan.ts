import {createHash} from 'node:crypto';
import policy from '../../../config/semantic-planning-policy.json';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {IndexedElement, IndexedFeature} from './modelIndex';
import type {OclParts} from './generateOclWithJsonMode';
import {RepairGuardError} from './repairGuards';
import {parseModelType} from './modelIndex';
import {compileEffectPlan, type EffectProgram, type PlannedEffect} from './semanticEffectPlan';
import {samePlanExpression, type PlanExpression} from './planExpressions';
export type {PlanExpression} from './planExpressions';

export const SEMANTIC_PLANNING_VERSION = 'model-grounded-contract-planning-v2';
export class PlanningReviewError extends RepairGuardError {
  constructor(
    public readonly planningReport: SemanticContractPlan,
    message = 'Planning is incomplete or ambiguous; no free-form generation was started.'
  ) {
    super('PLANNING_REVIEW_REQUIRED', message);
  }
}
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalized = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();
export type PlanSlot = {
  id: string;
  clause: 'precondition' | 'postcondition';
  taskId: string;
  requirement: string;
  requirementLine: number;
  ruleIds: string[];
  expectedType: string;
  goal: PlanExpression;
  allowedRefs: string[];
  targetFeatureId?: string;
  purpose: 'admissibility' | 'field-value' | 'association-value' | 'return-value';
};
export type PlanRequirement = {id: string; clause: PlanSlot['clause']; text: string; line: number};
type Requirement = PlanRequirement;
export type PlanningIssue = {code: string; message: string; taskId?: string; candidates?: string[]};
export type SemanticContractPlan = {
  version: typeof SEMANTIC_PLANNING_VERSION;
  policyVersion: string;
  policyHash: string;
  operationId: string;
  requirementHash: string;
  modelRulesHash: string;
  status: 'ready' | 'needs-review';
  issues: PlanningIssue[];
  intent: string;
  tasks: Requirement[];
  coveredTaskIds: string[];
  declarations: {id: string; name: string; type: string; source: IndexedElement['source']}[];
  selector: {
    entityId: string;
    entityName: string;
    featureId: string;
    featureName: string;
    parameterId: string;
    parameterName: string;
  } | null;
  action: 'query' | 'update' | 'delete' | 'create' | 'effect-program' | null;
  program?: EffectProgram;
  slots: PlanSlot[];
  assignments: {featureId: string; featureName: string; slotId: string}[];
  dependencies: {taskId: string; requires: string[]}[];
  hash: string;
};

export function parseRequirementSections(requirement: string, operationId: string) {
  let section: 'intent' | PlanSlot['clause'] | undefined;
  const seen = new Set<string>();
  const intent: string[] = [];
  const tasks: Requirement[] = [];
  const counts = {precondition: 0, postcondition: 0};
  for (const [index, raw] of requirement.split(/\r?\n/).entries()) {
    const text = raw.trim();
    if (!text) continue;
    const header = /^((?:Operation intent)|Preconditions|Postconditions):$/i.exec(text);
    if (header) {
      section = /^Operation/i.test(text)
        ? 'intent'
        : /^Pre/i.test(text)
          ? 'precondition'
          : 'postcondition';
      if (seen.has(section)) throw new Error(`Duplicate requirement section: ${section}`);
      seen.add(section);
      continue;
    }
    if (section === 'intent') {
      intent.push(text);
      continue;
    }
    const bullet = /^-\s+(.+)$/.exec(text);
    if (!section || !bullet) throw new Error(`Unsupported requirement layout at line ${index + 1}`);
    tasks.push({
      id: `${operationId}/semantic-task/${section === 'precondition' ? 'P' : 'Q'}${++counts[section]}`,
      clause: section,
      text: bullet[1],
      line: index + 1,
    });
  }
  if (seen.size !== 3 || !intent.length || !tasks.length)
    throw new Error('Incomplete structured requirement');
  return {intent: intent.join('\n'), tasks};
}

// This planner sees the supplied NL and indexed declarations only, never project reference clauses.
export function compileSemanticContractPlan(
  requirement: string,
  context: OperationModelGrounding
): SemanticContractPlan {
  const {index} = context;
  const {intent, tasks} = parseRequirementSections(requirement, index.operation.id);
  const effectPlan = compileEffectPlan({intent, tasks}, context);
  if (effectPlan) {
    const payload: Omit<SemanticContractPlan, 'hash'> = {
      ...effectPlan,
      version: SEMANTIC_PLANNING_VERSION,
      policyVersion: policy.version,
      policyHash: digest(policy),
      operationId: index.operation.id,
      requirementHash: createHash('sha256').update(requirement).digest('hex'),
      modelRulesHash: context.rules.rulesHash,
    };
    return {...payload, hash: digest(payload)};
  }
  const issues: PlanningIssue[] = [];
  const covered = new Set<string>();
  const slots: PlanSlot[] = [];
  const assignments: SemanticContractPlan['assignments'] = [];
  const used = new Map<string, SemanticContractPlan['declarations'][number]>();
  let selector: SemanticContractPlan['selector'] = null;
  let action: SemanticContractPlan['action'] = null;
  let entityName = '';
  let selectorPhrase = '';
  let intentFields = '';
  const patterns = [
    {
      action: 'query' as const,
      pattern: /^Retrieve the ([A-Za-z_]\w*) identified by the supplied (.+)\.$/,
    },
    {
      action: 'update' as const,
      pattern: /^Update the ([A-Za-z_]\w*) identified by (.+?) with the supplied (.+)\.$/,
    },
    {
      action: 'delete' as const,
      pattern: /^Delete the ([A-Za-z_]\w*) identified by the supplied (.+)\.$/,
    },
    {
      action: 'create' as const,
      pattern: /^Create a ([A-Za-z_]\w*) record from the supplied (.+)\.$/,
    },
  ];
  for (const item of patterns) {
    const match = item.pattern.exec(intent);
    if (match) {
      action = item.action;
      entityName = match[1];
      selectorPhrase = item.action === 'create' ? '' : match[2];
      intentFields = item.action === 'create' ? match[2] : item.action === 'update' ? match[3] : '';
      break;
    }
  }
  if (!action)
    issues.push({
      code: 'UNSUPPORTED_INTENT',
      message:
        'No supported evidence-preserving intent pattern matched; operation names are not used as semantics.',
    });
  const entity = index.entities.find((item) => item.name === entityName);
  if (action && !entity)
    issues.push({
      code: 'MODEL_ENTITY_MISSING',
      message: `Declared entity not found: ${entityName}`,
    });
  const allFeatures = index.entities.flatMap((item) => item.features);
  const features =
    entity?.effectiveFeatureIds.flatMap((id) => allFeatures.filter((item) => item.id === id)) ?? [];
  const namesFor = (phrase: string) =>
    new Set([
      normalized(phrase),
      normalized(phrase.replace(/\bidentifier\b/gi, 'id')),
      ...((policy.aliases as Record<string, string[]>)[phrase.toLowerCase()] ?? []).map(normalized),
    ]);
  const remember = (
    element: {id: string; name: string; source: IndexedElement['source']},
    type: string
  ) => {
    if (!element.source) issues.push({code: 'DECLARATION_SOURCE_MISSING', message: element.id});
    used.set(element.id, {id: element.id, name: element.name, type, source: element.source});
  };
  if (entity) remember(entity, entity.name);
  const compatible = (left: string, right: string) =>
    left === right || (['Integer', 'Real'].includes(left) && ['Integer', 'Real'].includes(right));
  const fieldBinding = (
    phrase: string,
    taskId?: string
  ): {feature: IndexedFeature; parameter: IndexedElement} | null => {
    const names = namesFor(phrase);
    const fields = features.filter(
      (item) => item.kind === 'attribute' && names.has(normalized(item.name))
    );
    const parameters = index.operation.parameters.filter((item) =>
      names.has(normalized(item.name))
    );
    const pairs = fields.flatMap((feature) =>
      parameters
        .filter((parameter) => compatible(feature.type.raw, parameter.type.raw))
        .map((parameter) => ({feature, parameter}))
    );
    if (pairs.length !== 1) {
      issues.push({
        code: pairs.length ? 'AMBIGUOUS_BINDING' : 'MODEL_BINDING_MISSING',
        taskId,
        message: `Cannot uniquely bind supplied field '${phrase}'.`,
        candidates: pairs.map((item) => `${item.feature.id} <- ${item.parameter.id}`),
      });
      return null;
    }
    remember(pairs[0].feature, pairs[0].feature.type.raw);
    remember(pairs[0].parameter, pairs[0].parameter.type.raw);
    return pairs[0];
  };
  const bindSelector = (phrase: string, taskId?: string) => {
    const pair = fieldBinding(phrase, taskId);
    if (entity && pair)
      selector = {
        entityId: entity.id,
        entityName: entity.name,
        featureId: pair.feature.id,
        featureName: pair.feature.name,
        parameterId: pair.parameter.id,
        parameterName: pair.parameter.name,
      };
  };
  if (action && action !== 'create' && entity) bindSelector(selectorPhrase);
  if (action === 'create' && entity) {
    const uniqueness = tasks.filter(
      (task) =>
        task.clause === 'precondition' &&
        new RegExp(`^No existing ${entityName} has the supplied (.+)\\.$`).test(task.text)
    );
    if (uniqueness.length === 1)
      bindSelector(
        new RegExp(`^No existing ${entityName} has the supplied (.+)\\.$`).exec(
          uniqueness[0].text
        )![1],
        uniqueness[0].id
      );
    else
      issues.push({
        code: 'UNSUPPORTED_CREATION_PRECONDITION',
        message:
          'This creation fragment needs an explicit, uniquely identified lookup obligation; uniqueness is not inferred from creation.',
      });
  }
  const slot = (
    task: Requirement,
    purpose: PlanSlot['purpose'],
    expectedType: string,
    goal: PlanExpression,
    refs: string[],
    targetFeatureId?: string
  ) => {
    const id = `${task.id}/slot/${slots.filter((item) => item.taskId === task.id).length + 1}`;
    const ids = new Set([...refs, ...(targetFeatureId ? [targetFeatureId] : [])]);
    slots.push({
      id,
      clause: task.clause,
      taskId: task.id,
      requirement: task.text,
      requirementLine: task.line,
      purpose,
      expectedType,
      goal,
      allowedRefs: refs,
      ...(targetFeatureId ? {targetFeatureId} : {}),
      ruleIds: context.rules.rules
        .filter((rule) => rule.modelElementIds.some((elementId) => ids.has(elementId)))
        .map((rule) => rule.id),
    });
    return id;
  };
  const targetId = `${index.operation.id}/planned-binding/target`;
  const targetRef: PlanExpression = {kind: 'ref', id: targetId};
  for (const task of tasks) {
    if (!entity || !action) continue;
    const exists =
      task.text === `The referenced ${entityName} exists.` ||
      task.text === `The referenced ${entityName} exists in the repository.`;
    const uniqueness = new RegExp(`^No existing ${entityName} has the supplied (.+)\\.$`).exec(
      task.text
    );
    if (
      task.clause === 'precondition' &&
      selector &&
      ((action !== 'create' && exists) || (action === 'create' && uniqueness))
    ) {
      const undefinedTest: PlanExpression = {kind: 'undefined', value: targetRef};
      slot(
        task,
        'admissibility',
        'Boolean',
        action === 'create' ? undefinedTest : {kind: 'not', value: undefinedTest},
        [targetId]
      );
      covered.add(task.id);
      continue;
    }
    const update = new RegExp(`^The stored ${entityName} contains the supplied (.+)\\.$`).exec(
      task.text
    );
    const create = new RegExp(`^A new ${entityName} is stored with the supplied (.+)\\.$`).exec(
      task.text
    );
    if (
      task.clause === 'postcondition' &&
      ((action === 'update' && update) || (action === 'create' && create))
    ) {
      const fieldText = (update ?? create)![1];
      const parts = fieldText
        .split(/,\s*|\s+and\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const statedFields = intentFields
        .split(/,\s*|\s+and\s+/)
        .map((item) => normalized(item))
        .sort();
      if (JSON.stringify(statedFields) !== JSON.stringify(parts.map(normalized).sort())) {
        issues.push({
          code: 'INTENT_OBLIGATION_CONFLICT',
          taskId: task.id,
          message: 'Intent and postcondition list different supplied fields.',
        });
        continue;
      }
      const bound = parts.map((part) => fieldBinding(part, task.id));
      if (parts.length && bound.every((item) => item !== null)) {
        for (const item of bound) {
          const valueSlot = slot(
            task,
            'field-value',
            item!.feature.type.raw,
            {kind: 'ref', id: item!.parameter.id},
            [item!.parameter.id],
            item!.feature.id
          );
          assignments.push({
            featureId: item!.feature.id,
            featureName: item!.feature.name,
            slotId: valueSlot,
          });
        }
        covered.add(task.id);
      }
      continue;
    }
    if (
      task.clause === 'postcondition' &&
      action === 'delete' &&
      task.text === `The ${entityName} is removed from the repository.`
    ) {
      covered.add(task.id);
      continue;
    }
    const returnedTarget =
      action === 'query' && task.text === `The operation returns the referenced ${entityName}.`;
    const booleanReturn = /^The operation returns (true|false)\.$/.exec(task.text);
    const returnedTrue = action !== 'query' && Boolean(booleanReturn);
    const result = index.operation.returnType;
    if (task.clause === 'postcondition' && (returnedTarget || returnedTrue)) {
      const expectedType = returnedTarget ? entityName : 'Boolean';
      if (!result || result.type.raw !== expectedType) {
        issues.push({
          code: 'RETURN_TYPE_MISMATCH',
          taskId: task.id,
          message: `Requirement returns ${expectedType}, signature does not.`,
        });
        continue;
      }
      remember(result, result.type.raw);
      slot(
        task,
        'return-value',
        expectedType,
        returnedTarget ? targetRef : {kind: 'literal', value: booleanReturn![1] === 'true'},
        returnedTarget ? [targetId] : []
      );
      covered.add(task.id);
      continue;
    }
    issues.push({code: 'UNSUPPORTED_REQUIREMENT', taskId: task.id, message: task.text});
  }
  for (const task of tasks)
    if (!covered.has(task.id) && !issues.some((issue) => issue.taskId === task.id))
      issues.push({code: 'UNACCOUNTED_REQUIREMENT', taskId: task.id, message: task.text});
  if (!selector)
    issues.push({
      code: 'SELECTOR_NOT_ESTABLISHED',
      message: 'Object selection has not been uniquely established from requirement evidence.',
    });
  if (!slots.some((item) => item.purpose === 'admissibility'))
    issues.push({
      code: 'ADMISSIBILITY_NOT_ESTABLISHED',
      message:
        'The supported lookup fragment requires an explicit existence or absence obligation.',
    });
  const returns = slots.filter((item) => item.purpose === 'return-value');
  if (returns.length !== 1)
    issues.push({
      code: 'RETURN_NOT_ESTABLISHED',
      message: 'The supported fragment requires exactly one explicit compatible return obligation.',
    });
  const payload: Omit<SemanticContractPlan, 'hash'> = {
    version: SEMANTIC_PLANNING_VERSION,
    policyVersion: policy.version,
    policyHash: digest(policy),
    operationId: index.operation.id,
    requirementHash: createHash('sha256').update(requirement).digest('hex'),
    modelRulesHash: context.rules.rulesHash,
    status: issues.length ? 'needs-review' : 'ready',
    issues,
    intent,
    tasks,
    coveredTaskIds: [...covered],
    declarations: [...used.values()],
    selector,
    action,
    slots,
    assignments,
    dependencies: tasks.map((task) => ({
      taskId: task.id,
      requires: selector ? [selector.entityId, selector.featureId, selector.parameterId] : [],
    })),
  };
  return {...payload, hash: digest(payload)};
}

export function assertSemanticContractPlan(
  plan: SemanticContractPlan,
  context: OperationModelGrounding
) {
  const {hash, ...payload} = plan;
  if (
    hash !== digest(payload) ||
    plan.version !== SEMANTIC_PLANNING_VERSION ||
    plan.operationId !== context.index.operation.id ||
    plan.modelRulesHash !== context.rules.rulesHash ||
    plan.policyHash !== digest(policy)
  )
    throw new Error('Semantic contract plan integrity mismatch');
  if (plan.status !== 'ready' || plan.coveredTaskIds.length !== plan.tasks.length)
    throw new Error('Semantic contract plan needs review');
}

export function renderPlanExpression(
  expression: PlanExpression,
  plan: SemanticContractPlan
): string {
  if (expression.kind === 'literal') return String(expression.value);
  if (expression.kind === 'ref') {
    const binding = plan.program?.bindings.find((item) => item.id === expression.id);
    if (binding) return binding.name;
    if (expression.id === `${plan.operationId}/planned-binding/target`) return 'plannedTarget';
    const declaration = plan.declarations.find((item) => item.id === expression.id);
    if (!declaration) throw new Error('Unknown plan reference');
    return expression.id.includes('/state/') ? `self.${declaration.name}` : declaration.name;
  }
  const feature = (id: string) => {
    const found = plan.declarations.find((item) => item.id === id);
    if (!found) throw new Error('Unknown plan feature');
    return found;
  };
  if (expression.kind === 'property')
    return `${renderPlanExpression(expression.object, plan)}.${feature(expression.featureId).name}`;
  if (expression.kind === 'enumeration') {
    const type = parseModelType(feature(expression.featureId).type);
    if (type.kind !== 'enum' || !type.literals?.includes(expression.literal))
      throw new Error('Invalid plan enumeration');
    return `${type.name}::${expression.literal}`;
  }
  if (expression.kind === 'binary')
    return `${renderPlanExpression(expression.left, plan)} ${expression.op} ${renderPlanExpression(expression.right, plan)}`;
  if (expression.kind === 'pre') return `${renderPlanExpression(expression.value, plan)}@pre`;
  if (expression.kind === 'size') return `${renderPlanExpression(expression.value, plan)}->size()`;
  if (expression.kind === 'undefined')
    return `${renderPlanExpression(expression.value, plan)}.oclIsUndefined()`;
  if (expression.value.kind === 'undefined')
    return `${renderPlanExpression(expression.value, plan)} = false`;
  if (expression.value.kind === 'literal') return String(!expression.value.value);
  if (expression.value.kind === 'not') return renderPlanExpression(expression.value.value, plan);
  return `${renderPlanExpression(expression.value, plan)} = false`;
}

export function materializeSemanticContract(
  plan: SemanticContractPlan,
  fills: Record<string, PlanExpression> = {}
): OclParts {
  const {hash, ...payload} = plan;
  if (hash !== digest(payload)) throw new Error('Semantic contract plan integrity mismatch');
  if (plan.status !== 'ready' || (!plan.selector && !plan.program))
    throw new Error('Cannot materialize an unresolved plan');
  for (const [id, expression] of Object.entries(fills)) {
    const slot = plan.slots.find((item) => item.id === id);
    if (!slot || !samePlanExpression(expression, slot.goal))
      throw new Error('Unvalidated slot fill cannot be materialized');
  }
  const value = (slot: PlanSlot) => renderPlanExpression(fills[slot.id] ?? slot.goal, plan);
  if (plan.program) {
    const declaration = (id: string) => {
      const found = plan.declarations.find((item) => item.id === id);
      if (!found) throw new Error('Missing program declaration');
      return found;
    };
    const bindingName = (id: string) => {
      const found = plan.program!.bindings.find((item) => item.id === id);
      if (!found) throw new Error('Missing program binding');
      return found.name;
    };
    const slotValue = (id: string) => value(plan.slots.find((item) => item.id === id)!);
    const emit = (effects: PlannedEffect[]): string =>
      effects
        .map((effect) => {
          if (effect.kind === 'conditional')
            return `if ${renderPlanExpression(effect.condition, plan)} then\n${emit(effect.then)}\nelse\n${emit(effect.otherwise)}\nendif`;
          if (effect.kind === 'store-created')
            return `${declaration(effect.entityId).name}.allInstances()->includes(${bindingName(effect.bindingId)})`;
          const target = renderPlanExpression(effect.target, plan);
          return effect.kind === 'include'
            ? `${target}->includes(${slotValue(effect.slotId)})`
            : `${target} = ${slotValue(effect.slotId)}`;
        })
        .join(' and\n');
    const created = plan.program.bindings.filter((binding) => binding.kind === 'created');
    const definitions = plan.program.bindings
      .filter((binding) => binding.kind !== 'created')
      .map((binding) => {
        const entity = declaration(binding.entityId).name;
        if (binding.kind === 'lookup')
          return `${binding.name}:${binding.type} = ${entity}.allInstances()->any(plannedElement:${entity} | plannedElement.${declaration(binding.keyId).name} = ${declaration(binding.parameterId).name})`;
        if (binding.kind !== 'filter') throw new Error('Unsupported binding');
        const enumValue = renderPlanExpression(
          {kind: 'enumeration', featureId: binding.featureId, literal: binding.literal},
          plan
        );
        return `${binding.name}:${binding.type} = ${entity}.allInstances()->select(plannedElement:${entity} | plannedElement.${declaration(binding.featureId).name} = ${enumValue})`;
      });
    return {
      definition: definitions.join(',\n'),
      precondition: plan.slots
        .filter((slot) => slot.clause === 'precondition')
        .map(value)
        .join(' and\n'),
      postcondition: `${created.length ? `let ${created.map((binding) => `${binding.name}:${binding.type}`).join(', ')} in\n${created.map((binding) => `${binding.name}.oclIsNew()`).join(' and\n')} and\n` : ''}${emit(plan.program.effects)}`,
    };
  }
  const {entityName, featureName, parameterName} = plan.selector!;
  const effects = plan.assignments.map(
    (item) =>
      `${plan.action === 'create' ? 'plannedCreated' : 'plannedTarget'}.${item.featureName} = ${value(plan.slots.find((slot) => slot.id === item.slotId)!)}`
  );
  if (plan.action === 'delete')
    effects.push(`${entityName}.allInstances()->excludes(plannedTarget)`);
  if (plan.action === 'create') effects.unshift('plannedCreated.oclIsNew()');
  if (plan.action === 'create')
    effects.push(`${entityName}.allInstances()->includes(plannedCreated)`);
  effects.push(
    ...plan.slots
      .filter((slot) => slot.purpose === 'return-value')
      .map((slot) => `result = ${value(slot)}`)
  );
  return {
    definition: `plannedTarget:${entityName} = ${entityName}.allInstances()->any(plannedElement:${entityName} | plannedElement.${featureName} = ${parameterName})`,
    precondition: plan.slots
      .filter((slot) => slot.clause === 'precondition')
      .map(value)
      .join(' and '),
    postcondition: `${plan.action === 'create' ? `let plannedCreated:${entityName} in\n` : ''}${effects.join(' and\n')}`,
  };
}

export const renderSemanticContractPlan = (plan: SemanticContractPlan) =>
  [
    `Program-owned semantic contract plan: ${plan.version}; hash ${plan.hash}`,
    'The program has resolved supported requirement semantics and owns object selection, effect targets, clause assembly and the slot goals. Do not output or replace an OCL contract.',
    `Intent: ${plan.intent}`,
    ...(plan.program ? [`Fixed program-owned effects: ${JSON.stringify(plan.program)}`] : []),
    ...plan.slots.map((slot) => JSON.stringify(slot)),
    'Only slot IDs requested by the program may be completed. Submit typed ASTs using ref, literal, undefined, not, property, pre, size, enumeration or binary. All references and semantic goals are checked; fixed effects and branch guards cannot be changed.',
  ].join('\n');
