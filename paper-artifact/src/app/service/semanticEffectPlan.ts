import policy from '../../../config/semantic-planning-policy.json';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {IndexedElement, ModelIndex} from './modelIndex';
import type {SemanticContractPlan, PlanRequirement, PlanSlot} from './semanticContractPlan';
import {planExpressionRefs, type PlanExpression} from './planExpressions';

export type EffectBinding = {
  id: string;
  name: string;
  type: string;
  entityId: string;
  taskIds: string[];
} & (
  | {kind: 'created'}
  | {kind: 'lookup'; keyId: string; parameterId: string}
  | {kind: 'filter'; featureId: string; literal: string}
);
export type PlannedEffect =
  | {kind: 'assign' | 'include'; taskId: string; target: PlanExpression; slotId: string}
  | {kind: 'store-created'; taskId: string; bindingId: string; entityId: string}
  | {
      kind: 'conditional';
      taskId: string;
      condition: PlanExpression;
      then: PlannedEffect[];
      otherwise: PlannedEffect[];
    };
export type EffectProgram = {
  version: 'typed-effect-plan-v1';
  profile: string;
  bindings: EffectBinding[];
  effects: PlannedEffect[];
};
type Body = Pick<
  SemanticContractPlan,
  | 'intent'
  | 'tasks'
  | 'coveredTaskIds'
  | 'declarations'
  | 'issues'
  | 'status'
  | 'selector'
  | 'action'
  | 'slots'
  | 'assignments'
  | 'dependencies'
  | 'program'
>;
const norm = (name: string) => name.replace(/[^a-z0-9]/gi, '').toLowerCase();
const ref = (id: string): PlanExpression => ({kind: 'ref', id});
const literal = (value: boolean | number | null): PlanExpression => ({kind: 'literal', value});
const property = (object: PlanExpression, featureId: string): PlanExpression => ({
  kind: 'property',
  object,
  featureId,
});
const defined = (value: PlanExpression): PlanExpression => ({
  kind: 'not',
  value: {kind: 'undefined', value},
});

// This is a declared controlled-language compiler, not a per-operation answer catalogue.
// Every emitted effect retains its input obligation and resolved model declaration IDs.
class EffectBuilder {
  readonly declarations = new Map<string, SemanticContractPlan['declarations'][number]>();
  readonly slots: PlanSlot[] = [];
  readonly covered = new Set<string>();
  readonly issues: SemanticContractPlan['issues'] = [];
  readonly program: EffectProgram;
  constructor(
    readonly parsed: {intent: string; tasks: PlanRequirement[]},
    readonly context: OperationModelGrounding,
    profile: string
  ) {
    this.program = {version: 'typed-effect-plan-v1', profile, bindings: [], effects: []};
  }
  fail(message: string): never {
    throw new Error(message);
  }
  one<T>(items: T[], label: string): T {
    return items.length === 1
      ? items[0]
      : this.fail(`Cannot uniquely bind ${label}; candidates=${items.length}`);
  }
  remember<T extends {id: string; name: string; source: IndexedElement['source']}>(
    element: T,
    type: string
  ) {
    if (!element.source) this.fail(`Missing declaration provenance: ${element.id}`);
    this.declarations.set(element.id, {
      id: element.id,
      name: element.name,
      source: element.source,
      type,
    });
    return element;
  }
  entity(name: string) {
    const entity = this.one(
      this.context.index.entities.filter((item) => item.name === name),
      name
    );
    return this.remember(entity, name);
  }
  features(entity: ModelIndex['entities'][number]) {
    return this.context.index.entities
      .flatMap((item) => item.features)
      .filter((item) => entity.effectiveFeatureIds.includes(item.id));
  }
  feature(entity: ModelIndex['entities'][number], names: string[], expected?: string) {
    const item = this.one(
      this.features(entity).filter(
        (item) =>
          names.some((name) => norm(name) === norm(item.name)) &&
          (!expected || item.type.raw === expected)
      ),
      `${entity.name}.${names.join('|')}`
    );
    return this.remember(item, item.type.raw);
  }
  parameter(names?: string[], expected?: string) {
    const item = this.one(
      this.context.index.operation.parameters.filter(
        (item) =>
          (!names || names.some((name) => norm(name) === norm(item.name))) &&
          (!expected || item.type.raw === expected)
      ),
      `parameter ${names?.join('|') ?? 'identifier'}`
    );
    return this.remember(item, item.type.raw);
  }
  state(names: string[], expected: string) {
    const items = this.context.index.operation.serviceState.filter((item) =>
      names.some((name) => norm(name) === norm(item.name))
    );
    if (
      !items.length ||
      new Set(items.map((item) => `${item.name}:${item.type.raw}`)).size !== 1 ||
      items.some((item) => item.type.raw !== expected)
    )
      this.fail(`Ambiguous or incompatible service state: ${names.join('|')}`);
    items.forEach((item) => this.remember(item, item.type.raw));
    return items[0];
  }
  task(text: string, clause: PlanRequirement['clause']) {
    return this.one(
      this.parsed.tasks.filter((item) => item.text === text && item.clause === clause),
      `requirement '${text}'`
    );
  }
  enumeration(entity: ModelIndex['entities'][number], value: string) {
    const field = this.one(
      this.features(entity).filter(
        (item) => item.type.kind === 'enum' && item.type.literals?.includes(value)
      ),
      `${entity.name} enumeration ${value}`
    );
    if (this.context.index.enumerations.find((item) => item.name === field.type.name)?.conflicting)
      this.fail(`Conflicting enum ${field.type.name}`);
    this.remember(field, field.type.raw);
    return {
      field,
      value: {kind: 'enumeration', featureId: field.id, literal: value} as PlanExpression,
    };
  }
  binding(
    entity: ModelIndex['entities'][number],
    task: PlanRequirement,
    parameter?: IndexedElement
  ) {
    const key = this.one(
      this.features(entity).filter(
        (item) =>
          item.kind === 'attribute' &&
          /id$/i.test(item.name) &&
          (!parameter || item.type.raw === parameter.type.raw)
      ),
      `${entity.name} identifier`
    );
    this.remember(key, key.type.raw);
    const param = parameter ?? this.parameter(undefined, key.type.raw);
    const binding: EffectBinding = {
      kind: 'lookup',
      id: `${this.context.index.operation.id}/planned-binding/${this.program.bindings.length + 1}`,
      name: `plannedObject${this.program.bindings.length + 1}`,
      type: entity.name,
      entityId: entity.id,
      keyId: key.id,
      parameterId: param.id,
      taskIds: [task.id],
    };
    this.program.bindings.push(binding);
    return ref(binding.id);
  }
  slot(
    task: PlanRequirement,
    goal: PlanExpression,
    expectedType: string,
    purpose: PlanSlot['purpose'],
    target?: PlanExpression
  ) {
    const ids = [
      ...new Set([...planExpressionRefs(goal), ...(target ? planExpressionRefs(target) : [])]),
    ];
    const targetFeatureId =
      target?.kind === 'property'
        ? target.featureId
        : target?.kind === 'ref'
          ? target.id
          : undefined;
    const slot: PlanSlot = {
      id: `${task.id}/slot/${this.slots.filter((item) => item.taskId === task.id).length + 1}`,
      clause: task.clause,
      taskId: task.id,
      requirement: task.text,
      requirementLine: task.line,
      goal,
      expectedType,
      purpose,
      allowedRefs: [...new Set(planExpressionRefs(goal))],
      ...(targetFeatureId ? {targetFeatureId} : {}),
      ruleIds: [
        ...new Set([
          'SP-EFFECT',
          ...this.context.rules.rules
            .filter((rule) => rule.modelElementIds.some((id) => ids.includes(id)))
            .map((rule) => rule.id),
        ]),
      ],
    };
    this.slots.push(slot);
    this.covered.add(task.id);
    return slot.id;
  }
  pre(task: PlanRequirement, goal: PlanExpression) {
    this.slot(task, goal, 'Boolean', 'admissibility');
  }
  assign(
    task: PlanRequirement,
    target: PlanExpression,
    goal: PlanExpression,
    type: string,
    effects = this.program.effects
  ) {
    effects.push({
      kind: 'assign',
      taskId: task.id,
      target,
      slotId: this.slot(task, goal, type, 'field-value', target),
    });
  }
  result(task: PlanRequirement, goal: PlanExpression, type: string) {
    const result = this.context.index.operation.returnType;
    if (!result || result.type.raw !== type) this.fail(`Return type does not match ${type}`);
    this.remember(result, result.type.raw);
    this.program.effects.push({
      kind: 'assign',
      taskId: task.id,
      target: ref(result.id),
      slotId: this.slot(task, goal, type, 'return-value'),
    });
  }
  finish(): Body {
    for (const task of this.parsed.tasks)
      if (!this.covered.has(task.id))
        this.issues.push({code: 'UNACCOUNTED_REQUIREMENT', taskId: task.id, message: task.text});
    const dependencies = (task: PlanRequirement) => {
      const ids = new Set(
        this.slots
          .filter((slot) => slot.taskId === task.id)
          .flatMap((slot) => [
            ...slot.allowedRefs,
            ...(slot.targetFeatureId ? [slot.targetFeatureId] : []),
          ])
      );
      const visit = (effects: PlannedEffect[]) => {
        for (const effect of effects) {
          if (effect.taskId === task.id) {
            if (effect.kind === 'conditional')
              planExpressionRefs(effect.condition).forEach((id) => ids.add(id));
            else if (effect.kind === 'store-created') {
              ids.add(effect.bindingId);
              ids.add(effect.entityId);
            } else planExpressionRefs(effect.target).forEach((id) => ids.add(id));
          }
          if (effect.kind === 'conditional') {
            visit(effect.then);
            visit(effect.otherwise);
          }
        }
      };
      visit(this.program.effects);
      for (const binding of this.program.bindings)
        if (ids.has(binding.id) || binding.taskIds.includes(task.id)) {
          ids.add(binding.id);
          ids.add(binding.entityId);
          if (binding.kind === 'lookup') {
            ids.add(binding.keyId);
            ids.add(binding.parameterId);
          }
          if (binding.kind === 'filter') ids.add(binding.featureId);
        }
      return {taskId: task.id, requires: [...ids]};
    };
    return {
      intent: this.parsed.intent,
      tasks: this.parsed.tasks,
      coveredTaskIds: [...this.covered],
      declarations: [...this.declarations.values()],
      issues: this.issues,
      status: this.issues.length ? 'needs-review' : 'ready',
      selector: null,
      action: 'effect-program',
      slots: this.slots,
      assignments: [],
      program: this.program,
      dependencies: this.parsed.tasks.map(dependencies),
    };
  }
}

function transitionIntent(intent: string) {
  let match = /^Open an existing (.+) and make it the current (.+)\.$/.exec(intent);
  if (match) return {action: 'open', entity: match[1], current: match[2], parent: null};
  match = /^Close an existing open (.+)\.$/.exec(intent);
  if (match) return {action: 'close', entity: match[1], current: null, parent: null};
  match = /^Open a (.+) in the current (.+) and make it the current (.+)\.$/.exec(intent);
  if (match) return {action: 'open', entity: match[1], current: match[3], parent: match[2]};
  match = /^Close a (.+) in the current open (.+)\.$/.exec(intent);
  return match ? {action: 'close', entity: match[1], current: null, parent: match[2]} : null;
}

function compileStateTransition(b: EffectBuilder) {
  const intent = transitionIntent(b.parsed.intent)!;
  const roles = policy.domainRoles.stateTransition;
  const resolve = (phrase: string) =>
    b.entity(
      b.one(
        b.context.index.entities.filter((entity) => norm(entity.name) === norm(phrase)),
        `entity phrase ${phrase}`
      ).name
    );
  const entity = resolve(intent.entity);
  const pre = b.one(
    b.parsed.tasks.filter(
      (task) =>
        task.clause === 'precondition' &&
        new RegExp(
          `^The ${entity.name} exists and (?:is (?:currently )?(?:open|closed)|has [A-Z]+ status)\\.$`
        ).test(task.text)
    ),
    'explicit target existence and state'
  );
  const target = b.binding(entity, pre);
  b.pre(pre, defined(target));
  const enumPre = /has ([A-Z]+) status\.$/.exec(pre.text);
  const before = enumPre
    ? b.enumeration(entity, enumPre[1])
    : {
        field: b.feature(entity, roles.booleanFeature, 'Boolean'),
        value: literal(/(?:currently )?open\.$/.test(pre.text)),
      };
  if (
    enumPre
      ? !roles.openEnum.includes(enumPre[1]) || intent.action !== 'close'
      : before.value.kind !== 'literal' || before.value.value !== (intent.action === 'close')
  )
    b.fail('The declared source state conflicts with the transition intent');
  b.pre(pre, {
    kind: 'binary',
    op: '=',
    left: property(target, before.field.id),
    right: before.value,
  });
  if (intent.parent) {
    const parent = resolve(intent.parent);
    const task = b.task(`The current ${parent.name} exists and is open.`, 'precondition');
    const current = ref(b.state([`${roles.currentPrefix}${parent.name}`], parent.name).id);
    b.pre(task, defined(current));
    b.pre(task, {
      kind: 'binary',
      op: '=',
      left: property(current, b.feature(parent, roles.booleanFeature, 'Boolean').id),
      right: literal(true),
    });
  }
  const post = b.one(
    b.parsed.tasks.filter(
      (task) =>
        task.clause === 'postcondition' &&
        new RegExp(`^The ${entity.name}(?: status)? becomes `).test(task.text)
    ),
    'explicit transition effect'
  );
  const match = new RegExp(
    `^The ${entity.name}( status)? becomes (open|closed|[A-Z]+)(?: and (?:is stored as|remains) the current (.+))?\\.$`
  ).exec(post.text);
  if (!match) b.fail('Unrecognized transition effect or additional effect text');
  let after: PlanExpression;
  if (enumPre) {
    if (!match[1] || !roles.closedEnum.includes(match[2]))
      b.fail('Expected an explicit closed enum post-state');
    const value = b.enumeration(entity, match[2]);
    if (value.field.id !== before.field.id)
      b.fail('Pre/post states refer to different enum features');
    after = value.value;
  } else {
    if (match[1] || match[2] !== (intent.action === 'open' ? 'open' : 'closed'))
      b.fail('The post-state conflicts with the transition intent');
    after = literal(match[2] === 'open');
  }
  b.assign(post, property(target, before.field.id), after, before.field.type.raw);
  if (match[3]) {
    if (norm(match[3]) !== norm(entity.name))
      b.fail('Current-object postcondition identifies a different entity');
    const state = b.state([`${roles.currentPrefix}${entity.name}`], entity.name);
    b.assign(post, ref(state.id), target, entity.name);
  }
  if (intent.current && (!match[3] || norm(intent.current) !== norm(match[3])))
    b.fail('The intent current-object effect is missing or inconsistent');
  b.result(b.task('The operation returns true.', 'postcondition'), literal(true), 'Boolean');
}

export function compileEffectPlan(
  parsed: {intent: string; tasks: PlanRequirement[]},
  context: OperationModelGrounding
): Body | null {
  let profile: string;
  if (transitionIntent(parsed.intent)) profile = 'explicit-state-transition';
  else if (
    /^Register a new (?:[a-z]+ )?([A-Z]\w*) member with contact, role, and optional reporting information\.$/.test(
      parsed.intent
    )
  )
    profile = 'optional-reporting-association';
  else if (
    /^End the authenticated [A-Z]+ session and eject the current card\.$/.test(parsed.intent)
  )
    profile = 'session-reset';
  else if (/^Apply one scheduled repayment to an open ([A-Z]\w*)\.$/i.test(parsed.intent))
    profile = 'scheduled-repayment';
  else if (parsed.intent === 'Load all submitted loan requests for credit-reference validation.')
    profile = 'filtered-current-collection';
  else if (/^Attach a selected loan term to the current loan request\.$/.test(parsed.intent))
    profile = 'attach-selected-object';
  else return null;
  const b = new EffectBuilder(parsed, context, profile);
  try {
    if (profile === 'explicit-state-transition') compileStateTransition(b);
    if (profile === 'session-reset') {
      const roles = policy.domainRoles.atmSession;
      const auth = b.task('The card identifier and password are validated.', 'precondition');
      for (const names of roles.authentication)
        b.pre(auth, {
          kind: 'binary',
          op: '=',
          left: ref(b.state(names, 'Boolean').id),
          right: literal(true),
        });
      const present = b.task('A current BankCard is present.', 'precondition');
      const card = ref(b.state(roles.currentCard, 'BankCard').id);
      b.pre(present, defined(card));
      b.assign(
        b.task('The current card is cleared.', 'postcondition'),
        card,
        literal(null),
        'BankCard'
      );
      const reset = b.task(
        'Authentication, deposit, and withdrawal state is reset, including transaction amounts.',
        'postcondition'
      );
      for (const names of [...roles.authentication, ...roles.transactionFlags])
        b.assign(reset, ref(b.state(names, 'Boolean').id), literal(false), 'Boolean');
      for (const names of roles.amounts) {
        const state = b.state(names, 'Real');
        b.assign(reset, ref(state.id), literal(0), state.type.raw);
      }
      b.result(b.task('The operation returns true.', 'postcondition'), literal(true), 'Boolean');
    }
    if (profile === 'scheduled-repayment') {
      const pre = b.one(
        parsed.tasks.filter(
          (task) =>
            task.clause === 'precondition' &&
            /^The ([A-Z]\w*) exists and has ([A-Z]+) status\.$/.test(task.text)
        ),
        'loan and status precondition'
      );
      const match = /^The ([A-Z]\w*) exists and has ([A-Z]+) status\.$/.exec(pre.text)!;
      const entity = b.entity(match[1]);
      if (!policy.domainRoles.repayment.openStatus.includes(match[2]))
        b.fail('The explicit status conflicts with the open-loan repayment intent');
      const target = b.binding(entity, pre);
      const intended = /^Apply one scheduled repayment to an open (\w+)\.$/i.exec(
        parsed.intent
      )![1];
      if (norm(intended) !== norm(entity.name))
        b.fail('Intent and precondition identify different entities');
      b.pre(pre, defined(target));
      const status = b.enumeration(entity, match[2]);
      b.pre(pre, {
        kind: 'binary',
        op: '=',
        left: property(target, status.field.id),
        right: status.value,
      });
      const effect = b.task(
        `The remaining amount decreases by the ${entity.name} repayment amount.`,
        'postcondition'
      );
      const remaining = b.feature(entity, policy.domainRoles.repayment.remaining, 'Real');
      const amount = b.feature(entity, policy.domainRoles.repayment.installment, 'Real');
      const targetAmount = property(target, remaining.id);
      b.assign(
        effect,
        targetAmount,
        {
          kind: 'binary',
          op: '-',
          left: {kind: 'pre', value: targetAmount},
          right: property(target, amount.id),
        },
        'Real'
      );
      b.result(b.task('The operation returns true.', 'postcondition'), literal(true), 'Boolean');
    }
    if (profile === 'filtered-current-collection') {
      const pre = b.task('At least one submitted LoanRequest exists.', 'precondition');
      const entity = b.entity('LoanRequest');
      const status = b.enumeration(entity, 'SUBMITTED');
      const binding: EffectBinding = {
        kind: 'filter',
        id: `${context.index.operation.id}/planned-binding/selected`,
        name: 'plannedSelection',
        entityId: entity.id,
        type: `Set(${entity.name})`,
        featureId: status.field.id,
        literal: 'SUBMITTED',
        taskIds: [pre.id],
      };
      b.program.bindings.push(binding);
      const selection = ref(binding.id);
      b.pre(pre, {
        kind: 'binary',
        op: '>',
        left: {kind: 'size', value: selection},
        right: literal(0),
      });
      const post = b.task(
        'The submitted requests become the current request collection and are returned.',
        'postcondition'
      );
      b.assign(
        post,
        ref(b.state(['CurrentLoanRequests'], binding.type).id),
        selection,
        binding.type
      );
      b.result(post, selection, binding.type);
    }
    if (profile === 'attach-selected-object') {
      const ownerTask = b.task('A current LoanRequest exists.', 'precondition');
      const owner = ref(b.state(['CurrentLoanRequest'], 'LoanRequest').id);
      b.pre(ownerTask, defined(owner));
      const selected = b.task('The selected LoanTerm exists.', 'precondition');
      const term = b.binding(b.entity('LoanTerm'), selected);
      b.pre(selected, defined(term));
      const ownerEntity = b.entity('LoanRequest');
      const association = b.one(
        b
          .features(ownerEntity)
          .filter(
            (feature) =>
              feature.kind === 'association' &&
              ['LoanTerm', 'Set(LoanTerm)'].includes(feature.type.raw)
          ),
        'LoanRequest -> LoanTerm association'
      );
      b.remember(association, association.type.raw);
      const post = b.task('The LoanTerm is linked to the current request.', 'postcondition');
      const target = property(owner, association.id);
      const slotId = b.slot(post, term, 'LoanTerm', 'association-value', target);
      b.program.effects.push({
        kind: association.type.kind === 'set' ? 'include' : 'assign',
        taskId: post.id,
        target,
        slotId,
      });
      b.result(b.task('The operation returns true.', 'postcondition'), literal(true), 'Boolean');
    }
    if (profile === 'optional-reporting-association') {
      const name = /^Register a new (?:[a-z]+ )?([A-Z]\w*) member /.exec(parsed.intent)![1];
      if (name !== 'Staff') b.fail('The identity/contact vocabulary adapter is scoped to Staff');
      const entity = b.entity(name);
      const pre = b.task('The staff identifier is unused.', 'precondition');
      const identity = b.parameter(['id'], 'Integer');
      const existing = b.binding(entity, pre, identity);
      b.pre(pre, {kind: 'undefined', value: existing});
      const createdTask = b.task(
        `A ${name} member is created with the supplied identity, password, phone, and role.`,
        'postcondition'
      );
      const created: EffectBinding = {
        kind: 'created',
        id: `${context.index.operation.id}/planned-binding/created`,
        name: 'plannedCreated',
        type: name,
        entityId: entity.id,
        taskIds: [createdTask.id],
      };
      b.program.bindings.push(created);
      const target = ref(created.id);
      for (const mapping of policy.domainRoles.staffRegistration.fields) {
        const feature = b.feature(entity, mapping.feature);
        const parameter = b.parameter(mapping.parameter, feature.type.raw);
        b.assign(createdTask, property(target, feature.id), ref(parameter.id), feature.type.raw);
      }
      b.program.effects.push({
        kind: 'store-created',
        taskId: createdTask.id,
        bindingId: created.id,
        entityId: entity.id,
      });
      const post = b.task(
        `If bossid identifies an existing ${name} member, the new ${name} member is linked to that Boss.`,
        'postcondition'
      );
      const boss = b.binding(entity, post, b.parameter(['bossid'], identity.type.raw));
      const association = b.feature(entity, ['Boss'], name);
      if (association.kind !== 'association') b.fail('Boss is not a declared association');
      const then: PlannedEffect[] = [];
      b.assign(post, property(target, association.id), boss, name, then);
      b.program.effects.push({
        kind: 'conditional',
        taskId: post.id,
        condition: defined(boss),
        then,
        otherwise: [],
      });
      b.result(b.task('The operation returns true.', 'postcondition'), literal(true), 'Boolean');
    }
  } catch (error) {
    b.issues.push({
      code: 'EFFECT_BINDING_UNRESOLVED',
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return b.finish();
}
