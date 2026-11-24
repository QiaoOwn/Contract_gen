import {ParserRuleContext} from 'antlr4';
import * as P from '../../../antlr4/REMODELParser';
import {
  createModelGroundingRules,
  modelTypeLabel as declaredTypeLabel,
  type ModelRuleFamily,
} from './modelGroundingRules';
import {parseModelType, type IndexedType} from './modelIndex';
import type {OperationModelGrounding} from './operationModelGrounding';
import {
  MODEL_RULE_VALIDATION_VERSION,
  modelRuleRepairPolicy,
  type ContractClause,
  type ModelRuleDiagnostic,
  type OclLocation,
} from './modelRuleDiagnostics';

type Value = {
  type?: IndexedType;
  bindings: Set<string>;
  elements: Set<string>;
  invalid?: boolean;
  isNull?: boolean;
};
type Binding = Value & {id: string; name: string; uses: OclLocation[]; declaration?: OclLocation};
export type RepairExpressionEvidence = OclLocation & {
  ast: string;
  modelElementIds: string[];
  bindingIds: string[];
  guards: OclLocation[];
};
export const oclSyntaxIdentity = (node: ParserRuleContext): string => {
  const visit = (part: ParserRuleContext): unknown => [
    part.constructor.name,
    ...(part.children ?? []).map((child) =>
      child instanceof ParserRuleContext ? visit(child) : ['token', child.getText()]
    ),
  ];
  return JSON.stringify(visit(node));
};
type Scope = Map<string, Binding>;
const value = (type?: IndexedType, elements: string[] = []): Value => ({
  type,
  bindings: new Set(),
  elements: new Set(elements),
});
const primitive = (name: string) => parseModelType(name);
const modelTypeLabel = (type: IndexedType): string =>
  type.kind === 'set'
    ? `Set(${type.element ? modelTypeLabel(type.element) : '?'})`
    : declaredTypeLabel(type);
const contexts = (node: ParserRuleContext) =>
  (node.children || []).filter(
    (child): child is ParserRuleContext => child instanceof ParserRuleContext
  );
const merge = (type: IndexedType | undefined, ...values: Value[]): Value => ({
  type,
  bindings: new Set(values.flatMap((item) => [...item.bindings])),
  elements: new Set(values.flatMap((item) => [...item.elements])),
  invalid: values.some((item) => item.invalid),
});

export const validateModelGroundedContract = ({
  tree,
  context,
  collectRepairEvidence = false,
}: {
  tree: P.RuleContractContext;
  context: OperationModelGrounding;
  collectRepairEvidence?: boolean;
}) => {
  const {index, rules} = context;
  if (
    createModelGroundingRules(index).rulesHash !== rules.rulesHash ||
    rules.operationId !== index.operation.id
  )
    throw new Error('Model validation context does not match its generation rule pack');
  const diagnostics: ModelRuleDiagnostic[] = [];
  const deferred: OclLocation[] = [];
  const entities = new Map(index.entities.map((entity) => [entity.name, entity]));
  const features = new Map(
    index.entities.flatMap((entity) =>
      entity.features.map((feature) => [feature.id, feature] as const)
    )
  );
  const enums = new Map(index.enumerations.map((enumeration) => [enumeration.name, enumeration]));
  const bindings = new Map<string, Binding>();
  const expressions: RepairExpressionEvidence[] = [];
  const references: (OclLocation & {modelElementId: string})[] = [];
  let clause: ContractClause = 'definition';
  let projectionSelectorDepth = 0;
  const location = (node: ParserRuleContext): OclLocation => ({
    clause,
    line: node.start.line,
    column: node.start.column + 1,
    endLine: node.stop?.line ?? node.start.line,
    endColumn: (node.stop?.column ?? node.start.column) + (node.stop?.text?.length ?? 1) + 1,
    startOffset: node.start.start,
    endOffset: (node.stop?.stop ?? node.start.stop) + 1,
    expression: node.getText(),
  });
  const reference = (node: ParserRuleContext, id: string) => {
    if (collectRepairEvidence) references.push({...location(node), modelElementId: id});
  };
  const declaration = (id: string) => {
    for (const entity of index.entities) {
      if (id === entity.id)
        return {
          id,
          declaration: `class ${entity.name}${entity.base ? ` extends ${entity.base}` : ''}`,
          source: entity.source,
        };
      const feature = entity.features.find((item) => item.id === id);
      if (feature)
        return {
          id,
          declaration: `${feature.owner}.${feature.name}: ${modelTypeLabel(feature.type)}`,
          source: feature.source,
        };
    }
    const item = [
      ...index.operation.parameters,
      ...index.operation.serviceState,
      ...(index.operation.returnType ? [index.operation.returnType] : []),
    ].find((element) => element.id === id);
    if (item)
      return {id, declaration: `${item.name}: ${modelTypeLabel(item.type)}`, source: item.source};
    return {
      id,
      declaration: `${index.operation.service}::${index.operation.name}`,
      source: index.operation.source,
    };
  };
  const report = (
    node: ParserRuleContext,
    family: ModelRuleFamily,
    code: string,
    msg: string,
    input: Value = value(),
    rootBindingId?: string
  ) => {
    const site = location(node);
    if (diagnostics.some((item) => item.code === code && item.startOffset === site.startOffset))
      return;
    const ids = [...input.elements].sort();
    const directIds = ids.filter(
      (id) =>
        family === 'MG-01' ||
        family === 'MG-04' ||
        family === 'MG-07' ||
        features.has(id) ||
        id.includes('/parameter/') ||
        id.includes('/state/')
    );
    diagnostics.push({
      ...site,
      kind: 'model-rule',
      family,
      code,
      msg: `[${family}] ${msg}`,
      ruleIds: rules.rules
        .filter(
          (rule) =>
            rule.family === family && rule.modelElementIds.some((id) => directIds.includes(id))
        )
        .map((rule) => rule.id),
      modelElementIds: ids,
      modelEvidence: ids.map(declaration),
      repair: modelRuleRepairPolicy(family),
      rootBindingId,
      relatedLocations: [],
    });
  };
  const subtype = (actual: string, expected: string): boolean => {
    const seen = new Set<string>();
    for (
      let name: string | null = actual;
      name && !seen.has(name);
      name = entities.get(name)?.base ?? null
    ) {
      if (name === expected) return true;
      seen.add(name);
    }
    return false;
  };
  const compatible = (expected: IndexedType, actual: IndexedType): boolean => {
    if (expected.kind === 'set' || actual.kind === 'set')
      return (
        expected.kind === actual.kind &&
        (!expected.element || !actual.element || compatible(expected.element, actual.element))
      );
    if (['Integer', 'Real'].includes(expected.name!) && ['Integer', 'Real'].includes(actual.name!))
      return true;
    if (
      ['Date', 'LocalDate'].includes(expected.name!) &&
      ['Date', 'LocalDate'].includes(actual.name!)
    )
      return true;
    return expected.name === actual.name || subtype(actual.name!, expected.name!);
  };
  const typeKnown = (type: IndexedType, node: ParserRuleContext): boolean => {
    if (type.kind === 'set') return typeKnown(type.element!, node);
    if (type.kind === 'primitive') return true;
    const enumeration = enums.get(type.name!);
    if (
      type.kind === 'enum' &&
      enumeration &&
      type.literals?.some((literal) => !enumeration.declarations[0].literals.includes(literal))
    ) {
      report(
        node,
        'MG-05',
        'INVALID_ENUM_DECLARATION',
        `Local enumeration declaration ${type.raw} introduces undeclared literals.`,
        value(
          undefined,
          enumeration.declarations.map((item) => item.elementId)
        )
      );
      return false;
    }
    if (entities.has(type.name!) || enums.has(type.name!)) return true;
    report(
      node,
      'MG-01',
      'UNKNOWN_TYPE',
      `Type ${type.raw} is not declared by this project.`,
      value(undefined, [index.operation.id])
    );
    return false;
  };
  const familyFor = (input: Value): ModelRuleFamily => {
    if (index.operation.returnType && input.elements.has(index.operation.returnType.id))
      return 'MG-07';
    return [...input.elements].some((id) => features.get(id)?.kind === 'association')
      ? 'MG-03'
      : 'MG-02';
  };
  const effectPosition = (node: ParserRuleContext) => {
    if (clause !== 'postcondition') return false;
    for (
      let child = node, parent = node.parentCtx;
      parent;
      child = parent, parent = parent.parentCtx
    ) {
      if (parent instanceof P.RuleIteratorExpCSContext) return false;
      if (parent instanceof P.RuleIfExpCSContext && parent.ruleOCLExpressionCS(0) === child)
        return false;
    }
    return true;
  };
  const resolve = (name: string, node: ParserRuleContext, scope: Scope): Value => {
    if (name === 'self')
      return value({raw: '$self', kind: 'named', name: '$self'}, [index.operation.id]);
    if (name === 'result') {
      const item = index.operation.returnType;
      if (clause !== 'postcondition' || !item || item.type.kind === 'void') {
        report(
          node,
          'MG-07',
          'RESULT_SCOPE',
          'result requires a value-returning operation and a postcondition position.',
          value(undefined, [index.operation.id, ...(item ? [item.id] : [])])
        );
        return {...value(), invalid: true};
      }
      reference(node, item.id);
      return value(item.type, [item.id]);
    }
    const binding = scope.get(name);
    if (binding) {
      binding.uses.push(location(node));
      if (index.operation.parameters.some((item) => item.id === binding.id))
        reference(node, binding.id);
      return {...binding, bindings: new Set([binding.id])};
    }
    const environment = index.environment.find((item) => item.name === name);
    if (environment) return value(parseModelType(environment.type));
    const state = index.operation.serviceState.filter((item) => item.name === name);
    report(
      node,
      'MG-06',
      state.length ? 'STATE_REQUIRES_SELF' : 'UNBOUND_VARIABLE',
      state.length
        ? `Service state ${name} must be accessed as self.${name}.`
        : `Variable ${name} has no visible parameter or local binding.`,
      value(undefined, state.length ? state.map((item) => item.id) : [index.operation.id])
    );
    return {...value(), invalid: true};
  };
  const access = (receiver: Value, name: string, node: ParserRuleContext): Value => {
    if (!receiver.type || receiver.invalid) return {...receiver, type: undefined};
    if (receiver.type.name === '$self') {
      const states = index.operation.serviceState.filter((item) => item.name === name);
      if (states.length) {
        states.forEach((state) => reference(node, state.id));
        return merge(
          states[0].type,
          receiver,
          value(
            undefined,
            states.map((item) => item.id)
          )
        );
      }
      const parameter = index.operation.parameters.find((item) => item.name === name);
      report(
        node,
        'MG-06',
        parameter ? 'PARAMETER_IS_NOT_STATE' : 'UNKNOWN_SERVICE_STATE',
        parameter
          ? `${name} is a parameter, not self state.`
          : `self.${name} is not declared service state.`,
        value(undefined, [index.operation.id, ...(parameter ? [parameter.id] : [])])
      );
      return {...receiver, type: undefined, invalid: true};
    }
    const entity = entities.get(receiver.type.name!);
    const feature = entity?.effectiveFeatureIds
      .map((id) => features.get(id)!)
      .find((item) => item.name === name);
    if (feature) {
      reference(node, feature.id);
      return merge(feature.type, receiver, value(undefined, [entity!.id, feature.id]));
    }
    const subtypeOnly =
      entity &&
      index.entities.filter(
        (item) =>
          item.name !== entity.name &&
          subtype(item.name, entity.name) &&
          item.features.some((feature) => feature.name === name)
      );
    const input = merge(
      undefined,
      receiver,
      value(undefined, entity ? [entity.id, ...(subtypeOnly || []).map((item) => item.id)] : [])
    );
    const family = receiver.type.kind === 'set' ? 'MG-03' : subtypeOnly?.length ? 'MG-04' : 'MG-02';
    report(
      node,
      family,
      'INVALID_FEATURE_ACCESS',
      `Feature ${name} is not available on ${modelTypeLabel(receiver.type)}${subtypeOnly?.length ? '; it is declared only on a subtype' : ''}.`,
      input
    );
    return {...input, invalid: true};
  };

  const infer = (node: ParserRuleContext, scope: Scope): Value => {
    const result = inferValue(node, scope);
    if (collectRepairEvidence && node instanceof P.RuleAtomicExpressionContext) {
      const guards: OclLocation[] = [];
      for (
        let child: ParserRuleContext = node, parent = node.parentCtx;
        parent;
        child = parent, parent = parent.parentCtx
      ) {
        if (parent instanceof P.RuleIfExpCSContext && parent.ruleOCLExpressionCS(0) !== child)
          guards.push(location(parent.ruleOCLExpressionCS(0)));
      }
      expressions.push({
        ...location(node),
        ast: oclSyntaxIdentity(node),
        modelElementIds: [...result.elements].sort(),
        bindingIds: [...result.bindings].sort(),
        guards,
      });
    }
    return result;
  };
  const inferValue = (node: ParserRuleContext, scope: Scope): Value => {
    if (node instanceof P.RuleVariableExpCSContext) return resolve(node.getText(), node, scope);
    if (node instanceof P.RulePropertyCallExpCSContext) {
      const parts = node.ruleVariableExpCS_list();
      let current = infer(parts[0], scope);
      if (parts[1]) current = access(current, parts[1].getText(), parts[1]);
      return access(current, node.ruleSimpleNameCS().getText(), node.ruleSimpleNameCS());
    }
    if (node instanceof P.RuleClassiferCallExpCSContext) {
      const name = node.ruleSimpleNameCS().getText();
      const entity = entities.get(name);
      if (!entity) {
        report(
          node,
          'MG-01',
          'UNKNOWN_CLASS',
          `Repository class ${name} is not declared.`,
          value(undefined, [index.operation.id])
        );
        return {...value(), invalid: true};
      }
      reference(node, entity.id);
      return value({raw: `Set(${name})`, kind: 'set', element: parseModelType(name)}, [entity.id]);
    }
    if (node instanceof P.RuleEnumLiteralExpCSContext) {
      const name = node.ruleSimpleNameCS().getText();
      const literal = node.RULE_ID().getText();
      const enumeration = enums.get(name);
      const ids = enumeration?.declarations.map((item) => item.elementId) ?? [index.operation.id];
      if (!enumeration || !enumeration.declarations[0].literals.includes(literal)) {
        report(
          node,
          'MG-05',
          'INVALID_ENUM_LITERAL',
          `${name}::${literal} is not a declared enumeration literal.`,
          value(undefined, ids)
        );
        return {...value(), invalid: true};
      }
      return value(parseModelType(name), ids);
    }
    if (node instanceof P.RuleVariableDeclarationCSContext) return bind(node, scope);
    if (node instanceof P.RuleLetExpCSContext) {
      const local = new Map(scope);
      node.ruleVariableDeclarationCS_list().forEach((binding) => bind(binding, local));
      return infer(node.ruleOCLExpressionCS(), local);
    }
    if (node instanceof P.RuleIteratorExpCSContext) {
      const sourceNode = node.ruleClassiferCallExpCS() || node.rulePropertyCallExpCS();
      const source = sourceNode
        ? infer(sourceNode, scope)
        : resolve(node.ruleSimpleNameCS().getText(), node.ruleSimpleNameCS(), scope);
      if (source.type && source.type.kind !== 'set' && !source.invalid)
        report(
          node,
          'MG-03',
          'ITERATOR_REQUIRES_COLLECTION',
          `Iterator source has type ${modelTypeLabel(source.type)}, not Set.`,
          source
        );
      const local = new Map(scope);
      for (const declaration of node.ruleVariableDeclarationCS_list()) {
        const bound = bind(declaration, local);
        if (
          source.type?.kind === 'set' &&
          source.type.element &&
          bound.type &&
          !bound.invalid &&
          !compatible(bound.type, source.type.element)
        ) {
          report(
            declaration,
            'MG-03',
            'ITERATOR_ELEMENT_TYPE',
            `Iterator ${declaration.ruleSimpleNameCS().getText()} has type ${modelTypeLabel(bound.type)}, but the source contains ${modelTypeLabel(source.type.element)}.`,
            source,
            [...bound.bindings][0]
          );
          local.get(declaration.ruleSimpleNameCS().getText())!.invalid = true;
        }
      }
      const bodyNode = node.ruleLogicFormulaExpCS() || node.ruleIfExpCS();
      const method = node.ruleIteratorIdentifier().getText();
      const body = (() => {
        if (method === 'sumBy' || method === 'projectSet') projectionSelectorDepth++;
        try {
          return bodyNode ? infer(bodyNode, local) : value();
        } finally {
          if (method === 'sumBy' || method === 'projectSet') projectionSelectorDepth--;
        }
      })();
      if (method === 'sumBy') {
        const numeric =
          body.type?.kind === 'primitive' && ['Integer', 'Real'].includes(body.type.name ?? '');
        if (!body.invalid && (!numeric || body.isNull))
          report(
            bodyNode ?? node,
            'MG-02',
            'AGGREGATE_SELECTOR_TYPE',
            'sumBy requires an Integer or Real selector on every branch.',
            merge(undefined, source, body)
          );
        return merge(numeric ? body.type : undefined, source, body);
      }
      if (method === 'projectSet') {
        const entity = body.type?.kind === 'named' && entities.has(body.type.name ?? '');
        if (!body.invalid && (!entity || body.isNull))
          report(
            bodyNode ?? node,
            'MG-03',
            'PROJECT_SET_SELECTOR_TYPE',
            'projectSet requires one declared model object on every selector branch, not a scalar, null or collection.',
            merge(undefined, source, body)
          );
        return merge(
          entity ? {raw: `Set(${body.type!.raw})`, kind: 'set', element: body.type} : undefined,
          source,
          body
        );
      }
      if (method === 'collect') {
        deferred.push(location(node));
        return merge(undefined, source, body);
      }
      return merge(
        method === 'any'
          ? source.type?.element
          : method === 'select'
            ? source.type
            : primitive('Boolean'),
        source
      );
    }
    if (node instanceof P.RuleStandardNavigationCallExpCSContext) {
      const sourceNode = node.ruleClassiferCallExpCS() || node.rulePropertyCallExpCS();
      const source = sourceNode
        ? infer(sourceNode, scope)
        : resolve(node.ruleSimpleNameCS().getText(), node.ruleSimpleNameCS(), scope);
      const operation = node.ruleStandardCollectionOperation();
      const argumentNode = operation.ruleSimpleNameCS();
      const argument = resolve(argumentNode.getText(), argumentNode, scope);
      const many =
        operation.getText().startsWith('includesAll') ||
        operation.getText().startsWith('excludesAll');
      if (!source.invalid && source.type && source.type.kind !== 'set')
        report(
          node,
          'MG-03',
          'MEMBERSHIP_REQUIRES_COLLECTION',
          'Membership operations require a Set-valued source.',
          source
        );
      if (!source.invalid && !argument.invalid && source.type?.kind === 'set' && argument.type) {
        const expected = many ? source.type : source.type.element;
        if (expected && !compatible(expected, argument.type))
          report(
            node,
            'MG-03',
            'MEMBERSHIP_ELEMENT_TYPE',
            `Membership argument ${modelTypeLabel(argument.type)} is incompatible with ${modelTypeLabel(expected)}.`,
            merge(undefined, source, argument)
          );
      }
      return merge(primitive('Boolean'), source, argument);
    }
    if (node instanceof P.RuleStandardOperationExpCSContext) {
      const parts = node.ruleVariableExpCS_list();
      let receiver = infer(parts[0], scope);
      if (parts[1]) receiver = access(receiver, parts[1].getText(), parts[1]);
      const operation = node.rulePredefineOp();
      const typeTest = operation.ruleStandardParameterOperation();
      if (typeTest?.ruleEntityType())
        typeKnown(parseModelType(typeTest.ruleEntityType().getText()), typeTest);
      const date = operation.ruleStandardDateOperation();
      if (date) {
        for (const child of contexts(date)) {
          if (child instanceof P.RulePropertyCallExpCSContext) infer(child, scope);
          else if (child instanceof P.RuleSimpleNameCSContext)
            resolve(child.getText(), child, scope);
        }
        return merge(
          date.getText().startsWith('After(') || date.getText().startsWith('Before(')
            ? primitive('Date')
            : primitive('Boolean'),
          receiver
        );
      }
      const name = operation.getText();
      if (name === 'size()') return merge(primitive('Integer'), receiver);
      if (name === 'sum()') {
        const element = receiver.type?.kind === 'set' ? receiver.type.element : undefined;
        if (!receiver.invalid && (!element || !['Integer', 'Real'].includes(element.name ?? '')))
          report(
            node,
            'MG-02',
            'SUM_REQUIRES_NUMERIC_SET',
            'sum() requires Set(Integer) or Set(Real); use sumBy for an object selector.',
            receiver
          );
        return merge(element, receiver);
      }
      return merge(primitive('Boolean'), receiver);
    }
    if (node instanceof P.RuleAtomicExpressionContext) {
      const left = infer(node.ruleLeftSubAtomicExpression(), scope);
      const rightNode = node.ruleRightSubAtomicExpression();
      if (!rightNode) return left;
      const right = infer(rightNode, scope);
      for (const child of contexts(node))
        if (child instanceof P.RuleAtomicExpressionContext) infer(child, scope);
      if (
        node.ruleInfixCompareOperatorName()?.getText() === '=' &&
        effectPosition(node) &&
        left.type &&
        right.type &&
        !left.invalid &&
        !right.invalid &&
        !left.isNull &&
        !right.isNull &&
        !compatible(left.type, right.type)
      )
        report(
          node,
          familyFor(left),
          'INCOMPATIBLE_VALUE_TYPES',
          `Types ${modelTypeLabel(left.type)} and ${modelTypeLabel(right.type)} are incompatible.`,
          merge(undefined, left, right)
        );
      return merge(primitive('Boolean'), left, right);
    }
    if (node instanceof P.RuleIfExpCSContext) {
      const branches = node.ruleOCLExpressionCS_list().map((child) => infer(child, new Map(scope)));
      const guard = branches[0];
      if (projectionSelectorDepth && !guard.invalid && guard.type?.name !== 'Boolean')
        report(
          node.ruleOCLExpressionCS(0),
          'MG-02',
          'AGGREGATE_CONDITION_TYPE',
          'Projection/reduction conditional guards must be Boolean.',
          guard
        );
      const yes = branches[1];
      const no = branches[2];
      return merge(
        yes?.type && no?.type && compatible(yes.type, no.type)
          ? yes.type.name === 'Real' || no.type.name === 'Real'
            ? primitive('Real')
            : yes.type
          : undefined,
        ...branches
      );
    }
    if (node instanceof P.RuleNullLiteralExpCSContext) return {...value(), isNull: true};
    if (node instanceof P.RuleNumberLiteralExpCSContext)
      return value(primitive(node.ruleRealLiteralExpCS() ? 'Real' : 'Integer'));
    if (node instanceof P.RuleStringLiteralExpCSContext) return value(primitive('String'));
    if (node instanceof P.RuleBooleanLiteralExpCSContext) return value(primitive('Boolean'));
    if (node instanceof P.RuleCollectionLiteralExpCSContext) {
      const parts = contexts(node).map((child) => infer(child, scope));
      const element = parts.find((part) => part.type)?.type;
      return merge(
        {raw: `Set(${element ? modelTypeLabel(element) : '?'})`, kind: 'set', element},
        ...parts
      );
    }
    const children = contexts(node);
    const parts = children.map((child) => infer(child, scope));
    if (parts.length === 1) return parts[0];
    if (node instanceof P.RuleLogicFormulaExpCSContext)
      return merge(primitive('Boolean'), ...parts);
    // Unknown forms are not evidence of a violation; existing lowering/static checks remain authoritative.
    if (parts.length > 1) {
      deferred.push(location(node));
      return merge(undefined, ...parts);
    }
    return value();
  };
  const bind = (node: P.RuleVariableDeclarationCSContext, scope: Scope): Value => {
    const name = node.ruleSimpleNameCS().getText();
    const typeNode = node.ruleTypeCS();
    const type = typeNode ? parseModelType(typeNode.getText()) : undefined;
    const id = `binding:${node.start.start}:${name}`;
    const firstError = diagnostics.length;
    const validType = !type || typeKnown(type, typeNode!);
    const initializer = node.ruleOCLExpressionCS();
    const initial = initializer ? infer(initializer, scope) : value();
    const binding: Binding = {
      ...initial,
      id,
      name,
      declaration: location(node),
      type,
      uses: [],
      invalid: !validType || initial.invalid,
    };
    bindings.set(id, binding);
    for (const diagnostic of diagnostics.slice(firstError)) diagnostic.rootBindingId ??= id;
    if (
      type &&
      initial.type &&
      !binding.invalid &&
      !initial.isNull &&
      !compatible(type, initial.type)
    ) {
      report(
        node,
        familyFor(initial),
        'BINDING_INITIALIZER_TYPE',
        `Binding ${name}: ${modelTypeLabel(type)} cannot receive ${modelTypeLabel(initial.type)}.`,
        initial,
        id
      );
      binding.invalid = true;
    }
    scope.set(name, binding);
    return {...binding, bindings: new Set([id])};
  };

  const scope: Scope = new Map();
  for (const parameter of index.operation.parameters) {
    const binding: Binding = {
      ...value(parameter.type, [parameter.id]),
      id: parameter.id,
      name: parameter.name,
      uses: [],
    };
    scope.set(parameter.name, binding);
    bindings.set(binding.id, binding);
  }
  const definition = tree.ruleDefinition();
  if (definition) for (const node of definition.ruleVariableDeclarationCS_list()) bind(node, scope);
  clause = 'precondition';
  infer(tree.rulePrecondition().ruleOCLExpressionCS(), new Map(scope));
  clause = 'postcondition';
  infer(tree.rulePostcondition().ruleOCLExpressionCS(), new Map(scope));

  for (const diagnostic of diagnostics) {
    if (!diagnostic.rootBindingId) continue;
    const affected = new Set([diagnostic.rootBindingId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const binding of bindings.values())
        if (!affected.has(binding.id) && [...binding.bindings].some((id) => affected.has(id))) {
          affected.add(binding.id);
          changed = true;
        }
    }
    diagnostic.relatedLocations = [...affected].flatMap((id) => bindings.get(id)?.uses || []);
  }
  // Type inference can omit iterator predicates from its result type. Repair evidence must
  // still retain their lexical dependencies, including shadowed iterator/let bindings.
  const inside = (inner: OclLocation, outer: OclLocation) =>
    inner.clause === outer.clause &&
    inner.startOffset >= outer.startOffset &&
    inner.endOffset <= outer.endOffset;
  const lexicalDependencies = (site: OclLocation) =>
    [...bindings.values()]
      .filter((binding) => binding.uses.some((use) => inside(use, site)))
      .map((binding) => binding.id);
  if (collectRepairEvidence) {
    for (const expression of expressions) {
      expression.bindingIds = [
        ...new Set([...expression.bindingIds, ...lexicalDependencies(expression)]),
      ].sort();
      expression.modelElementIds = [
        ...new Set([
          ...expression.modelElementIds,
          ...references
            .filter((reference) => inside(reference, expression))
            .map((reference) => reference.modelElementId),
        ]),
      ].sort();
    }
  }
  return {
    version: MODEL_RULE_VALIDATION_VERSION,
    rulesHash: rules.rulesHash,
    diagnostics,
    deferred,
    ...(collectRepairEvidence
      ? {
          repairEvidence: {
            expressions,
            references,
            bindings: [...bindings.values()].map((binding) => ({
              id: binding.id,
              name: binding.name,
              declaration: binding.declaration,
              dependsOn: [
                ...new Set([
                  ...binding.bindings,
                  ...(binding.declaration ? lexicalDependencies(binding.declaration) : []),
                ]),
              ]
                .filter((id) => id !== binding.id)
                .sort(),
              uses: binding.uses,
            })),
          },
        }
      : {}),
  };
};

export type ModelRuleValidationResult = ReturnType<typeof validateModelGroundedContract>;
