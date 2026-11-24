import {createHash} from 'node:crypto';
import {
  MODEL_INDEX_VERSION,
  type IndexedType,
  type ModelIndex,
  type ModelSource,
} from './modelIndex';

export const MODEL_GROUNDING_RULES_VERSION = 'model-grounding-rules-v1';

export const MODEL_RULE_FAMILIES = [
  {
    id: 'MG-01',
    name: 'Model vocabulary',
    meaning: 'Use declared model classes and enum types.',
    existingChecks:
      'Model-rule AST checks for declared types and repository classes, plus TypeScript diagnostics; not a full OCL type system.',
  },
  {
    id: 'MG-02',
    name: 'Attribute ownership and type',
    meaning: 'Access attributes through their declaring class or a compatible subtype.',
    existingChecks:
      'Model-rule checks for known receiver features, typed bindings and supported Q value compatibility; Integer/Real remain compatible here and in the number representation.',
  },
  {
    id: 'MG-03',
    name: 'Association navigation',
    meaning: 'Preserve the declared association target and single-valued or Set-valued shape.',
    existingChecks:
      'Model-rule checks for Set iterator sources, element bindings and membership arguments; lower multiplicity and inverse maintenance are not inferred.',
  },
  {
    id: 'MG-04',
    name: 'Inheritance-aware access',
    meaning: 'Resolve inherited features and bind subtype-only access to the appropriate subtype.',
    existingChecks:
      'Inherited-feature resolution and subtype-only access diagnostics; OCL type tests do not automatically narrow a binding.',
  },
  {
    id: 'MG-05',
    name: 'Enumeration membership',
    meaning: 'Use the exact declared enumeration name and literals.',
    existingChecks:
      'Model-rule checks for exact qualified enum literals and locally declared literal membership.',
  },
  {
    id: 'MG-06',
    name: 'Operation variable scope',
    meaning: 'Distinguish parameters from service state, accessed through self.',
    existingChecks:
      'Lexical binding, parameter and self-state diagnostics with declaration provenance; typed helper variables remain permitted.',
  },
  {
    id: 'MG-07',
    name: 'Result discipline',
    meaning:
      'Constrain result only in the postcondition and according to the declared return type.',
    existingChecks:
      'Result scope and supported value-type diagnostics, plus generated return annotations; behavioral value obligations still require independent evaluation.',
  },
] as const;

export type ModelRuleFamily = (typeof MODEL_RULE_FAMILIES)[number]['id'];
export type ModelRuleFact =
  | {kind: 'vocabulary'; entities: string[]; enumerations: string[]}
  | {kind: 'attribute'; owner: string; name: string; type: IndexedType}
  | {kind: 'association'; owner: string; name: string; type: IndexedType; associationType: string}
  | {kind: 'inheritance'; subtype: string; base: string; inheritedFeatureIds: string[]}
  | {kind: 'enumeration'; name: string; literals: string[]}
  | {kind: 'binding'; binding: 'parameter' | 'service-state'; name: string; type: IndexedType}
  | {kind: 'result'; allowed: boolean; type: IndexedType | null};

export type ModelGroundingRule = {
  id: string;
  family: ModelRuleFamily;
  fact: ModelRuleFact;
  instruction: string;
  modelElementIds: string[];
  sources: ModelSource[];
};
export type ModelGroundingRulePack = {
  schemaVersion: typeof MODEL_GROUNDING_RULES_VERSION;
  modelIndexVersion: typeof MODEL_INDEX_VERSION;
  operationId: string;
  project: string;
  useCase: string;
  operation: string;
  rulesHash: string;
  rules: ModelGroundingRule[];
};

export const modelTypeLabel = (type: IndexedType): string => {
  if (type.kind === 'unsupported') throw new Error(`Unsupported rule type: ${type.raw}`);
  if (type.kind === 'set') return `Set(${modelTypeLabel(type.element!)})`;
  return type.name!;
};

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// Facts and rule text are derived from declarations only. Provenance stays out of prompt text.
export const createModelGroundingRules = (index: ModelIndex): ModelGroundingRulePack => {
  if (index.schemaVersion !== MODEL_INDEX_VERSION)
    throw new Error('Unsupported model index version');
  if (index.issues.length)
    throw new Error(
      `Unresolved model issues: ${index.issues.map((issue) => issue.code).join(', ')}`
    );
  const elements = [
    index.operation,
    ...index.entities,
    ...index.entities.flatMap((entity) => entity.features),
    ...index.operation.parameters,
    ...index.operation.serviceState,
    ...(index.operation.returnType ? [index.operation.returnType] : []),
  ];
  const sources = new Map(elements.map((element) => [element.id, element.source]));
  if (sources.size !== elements.length) throw new Error('Duplicate model element IDs');
  for (const element of elements) {
    if (!element.source) throw new Error(`Missing declaration provenance: ${element.id}`);
  }
  const entities = [...index.entities].sort((a, b) => compare(a.name, b.name));
  const rules: ModelGroundingRule[] = [];
  const add = (
    family: ModelRuleFamily,
    subject: string,
    fact: ModelRuleFact,
    instruction: string,
    modelElementIds: string[]
  ) => {
    const ids = [...new Set(modelElementIds)].sort(compare);
    const evidence = new Map<string, ModelSource>();
    for (const id of ids) {
      const source = sources.get(id);
      if (!source) throw new Error(`Unresolved rule dependency: ${id}`);
      evidence.set(`${source.file}:${source.line}:${source.column}`, source);
    }
    rules.push({
      id: `${family}::${subject}`,
      family,
      fact: structuredClone(fact),
      instruction,
      modelElementIds: ids,
      sources: [...evidence.values()]
        .map((source) => ({...source}))
        .sort((a, b) => compare(a.file, b.file) || a.line - b.line || a.column - b.column),
    });
  };
  const enumElements = index.enumerations.flatMap((enumeration) =>
    enumeration.declarations.map((declaration) => declaration.elementId)
  );
  const classNames = entities.map((entity) => entity.name);
  const enumNames = index.enumerations.map((enumeration) => enumeration.name).sort(compare);
  add(
    'MG-01',
    `${index.project}/vocabulary`,
    {kind: 'vocabulary', entities: classNames, enumerations: enumNames},
    `Model classes: ${classNames.join(', ') || '(none)'}. Enumeration types: ${enumNames.join(', ') || '(none)'}. Preserve these model names exactly. Typed local helper and iterator names may be introduced; they are not new model elements.`,
    [...entities.map((entity) => entity.id), ...enumElements, index.operation.id]
  );
  for (const entity of entities) {
    for (const feature of [...entity.features].sort((a, b) => compare(a.id, b.id))) {
      if (feature.kind === 'attribute') {
        add(
          'MG-02',
          feature.id,
          {kind: 'attribute', owner: entity.name, name: feature.name, type: feature.type},
          `${entity.name}.${feature.name}: ${modelTypeLabel(feature.type)}. Access this attribute through a binding of ${entity.name} or a compatible subtype; preserve its declared spelling and value type.`,
          [entity.id, feature.id]
        );
      } else {
        const isSet = feature.type.kind === 'set';
        add(
          'MG-03',
          feature.id,
          {
            kind: 'association',
            owner: entity.name,
            name: feature.name,
            type: feature.type,
            associationType: feature.associationType!,
          },
          `${entity.name}.${feature.name}: ${modelTypeLabel(feature.type)}. This is ${isSet ? `a collection with element type ${modelTypeLabel(feature.type.element!)}` : 'a single-valued navigation'}. ${isSet ? 'Use typed collection queries; link changes use the dialect membership forms only when required.' : 'Navigate as an object; link assignment or clearing requires an explicit requirement.'} The declaration alone does not require creation, deletion, inverse updates, or a nonempty value.`,
          [entity.id, feature.id]
        );
      }
    }
    if (entity.base) {
      const inheritedFeatureIds = entity.effectiveFeatureIds
        .filter((id) => !entity.features.some((feature) => feature.id === id))
        .sort(compare);
      const base = entities.find((candidate) => candidate.name === entity.base);
      if (!base) throw new Error(`Missing inherited class: ${entity.base}`);
      add(
        'MG-04',
        entity.id,
        {kind: 'inheritance', subtype: entity.name, base: entity.base, inheritedFeatureIds},
        `${entity.name} extends ${entity.base}; its binding may access inherited features. Bind subtype-only features through ${entity.name}; a type-test branch alone does not narrow a base-typed OCL binding in this backend.`,
        [entity.id, base.id, ...inheritedFeatureIds]
      );
    }
  }
  for (const enumeration of [...index.enumerations].sort((a, b) => compare(a.name, b.name))) {
    if (enumeration.conflicting) throw new Error(`Conflicting enum: ${enumeration.name}`);
    const variants = new Set(
      enumeration.declarations.map((declaration) =>
        JSON.stringify([...declaration.literals].sort(compare))
      )
    );
    if (!enumeration.declarations.length || variants.size !== 1)
      throw new Error(`Inconsistent enum: ${enumeration.name}`);
    const literals = [...enumeration.declarations[0].literals].sort(compare);
    add(
      'MG-05',
      enumeration.id,
      {kind: 'enumeration', name: enumeration.name, literals},
      `${enumeration.name}: use only ${literals.map((literal) => `${enumeration.name}::${literal}`).join(', ')}. Preserve source spellings; do not introduce aliases.`,
      enumeration.declarations.map((declaration) => declaration.elementId)
    );
  }
  for (const parameter of index.operation.parameters) {
    add(
      'MG-06',
      parameter.id,
      {kind: 'binding', binding: 'parameter', name: parameter.name, type: parameter.type},
      `Parameter ${parameter.name}: ${modelTypeLabel(parameter.type)}. Reference it as ${parameter.name}, not self.${parameter.name}; preserve its declared name and type.`,
      [index.operation.id, parameter.id]
    );
  }
  const state = new Map<string, typeof index.operation.serviceState>();
  for (const variable of index.operation.serviceState)
    state.set(variable.name, [...(state.get(variable.name) || []), variable]);
  for (const [name, declarations] of [...state].sort(([a], [b]) => compare(a, b))) {
    const type = declarations[0].type;
    if (declarations.some((item) => item.type.raw !== type.raw))
      throw new Error(`Conflicting state ${name}`);
    add(
      'MG-06',
      `${index.operation.id}/state/${name}`,
      {kind: 'binding', binding: 'service-state', name, type},
      `Service state self.${name}: ${modelTypeLabel(type)}. Access it through self; the model declaration does not itself require changing it.`,
      declarations.map((item) => item.id)
    );
  }
  const resultType = index.operation.returnType?.type ?? null;
  const allowed = resultType !== null && resultType.kind !== 'void';
  add(
    'MG-07',
    index.operation.id,
    {kind: 'result', allowed, type: resultType},
    allowed
      ? `The operation returns ${modelTypeLabel(resultType!)}. Use result only in the postcondition, with a compatible value satisfying the stated return obligation; do not assume a Boolean result is true.`
      : 'The operation has no value return. Do not introduce result in definition, precondition, or postcondition.',
    [index.operation.id, ...(index.operation.returnType ? [index.operation.returnType.id] : [])]
  );
  rules.sort((a, b) => compare(a.id, b.id));
  if (new Set(rules.map((rule) => rule.id)).size !== rules.length)
    throw new Error('Duplicate model rule IDs');
  const payload = rules.map(({id, family, fact, instruction, modelElementIds}) => ({
    id,
    family,
    fact,
    instruction,
    modelElementIds,
  }));
  return {
    schemaVersion: MODEL_GROUNDING_RULES_VERSION,
    modelIndexVersion: index.schemaVersion,
    operationId: index.operation.id,
    project: index.project,
    useCase: index.useCase,
    operation: index.operation.name,
    rulesHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
    rules,
  };
};

const compactInstance = ({fact}: ModelGroundingRule): string => {
  switch (fact.kind) {
    case 'vocabulary':
      return `Classes: ${fact.entities.join(', ') || '(none)'}; enums: ${fact.enumerations.join(', ') || '(none)'}. Typed local helpers and iterators may be introduced.`;
    case 'attribute':
      return `${fact.owner}.${fact.name}: ${modelTypeLabel(fact.type)}`;
    case 'association':
      return `${fact.owner}.${fact.name}: ${modelTypeLabel(fact.type)} (${fact.type.kind === 'set' ? 'collection navigation' : 'single-valued navigation'})`;
    case 'inheritance':
      return `${fact.subtype} extends ${fact.base}. A type-test branch alone does not narrow a base-typed OCL binding.`;
    case 'enumeration':
      return `${fact.name}: ${fact.literals.map((value) => `${fact.name}::${value}`).join(', ')}; no spelling aliases.`;
    case 'binding':
      return `${fact.binding === 'parameter' ? `Parameter ${fact.name} (bare identifier)` : `Service state self.${fact.name}`}: ${modelTypeLabel(fact.type)}`;
    case 'result':
      return fact.allowed
        ? `result: ${modelTypeLabel(fact.type!)}; postcondition only; the requirement determines its value, including Boolean results.`
        : 'No value return: result is forbidden in D, P and Q.';
  }
};

export const renderModelGroundingRules = (pack: ModelGroundingRulePack) =>
  [
    'Model-derived generation constraints:',
    'Apply these declarations together with the supplied requirement and OCLTSVM dialect rules.',
    'A declaration permits a reference; it does not establish that the requirement needs that feature or effect.',
    'Do not infer uniqueness, nonempty associations, object creation/deletion, inverse updates or cascade behavior from declarations.',
    ...MODEL_RULE_FAMILIES.flatMap((family) => {
      const instances = pack.rules.filter((rule) => rule.family === family.id);
      return instances.length
        ? [
            `[${family.id}] ${family.meaning}`,
            ...instances.map((rule) => `- ${compactInstance(rule)}`),
          ]
        : [];
    }),
  ].join('\n');

export const createModelGroundingPreview = (baseContent: string, pack: ModelGroundingRulePack) => {
  const content = `${baseContent}\n\n${renderModelGroundingRules(pack)}`;
  return {
    schemaVersion: 'contractgen-model-grounding-preview-v1' as const,
    previewOnly: true as const,
    baseInputHash: createHash('sha256').update(baseContent).digest('hex'),
    rulesHash: pack.rulesHash,
    inputHash: createHash('sha256').update(content).digest('hex'),
    content,
  };
};
