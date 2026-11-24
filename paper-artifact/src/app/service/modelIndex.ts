import type {Entity} from '@/rm2pt/model/Entity';
import type {UseCase} from '@/rm2pt/model/UseCase';

export const MODEL_INDEX_VERSION = 'contractgen-model-index-v1';

export type ModelSource = {
  file: string;
  line: number;
  column: number;
  endLine: number;
  sha256: string;
};
export type ModelOrigin = {
  kind: 'entity' | 'attribute' | 'association' | 'state' | 'operation' | 'parameter' | 'return';
  owner: string;
  name: string;
  useCase: string;
  operation: string;
  service?: string;
  systemState?: boolean;
};
export type IndexedType = {
  raw: string;
  kind: 'primitive' | 'named' | 'enum' | 'set' | 'void' | 'unsupported';
  name?: string;
  literals?: string[];
  element?: IndexedType;
};
export type IndexedElement = {
  id: string;
  name: string;
  type: IndexedType;
  source: ModelSource | null;
};
export type IndexedFeature = IndexedElement & {
  kind: 'attribute' | 'association';
  owner: string;
  associationType?: string;
};
export type ModelIndexIssue = {
  code: string;
  elementIds: string[];
  message: string;
};
export type ModelIndex = {
  schemaVersion: typeof MODEL_INDEX_VERSION;
  project: string;
  useCase: string;
  operation: {
    id: string;
    name: string;
    service: string;
    source: ModelSource | null;
    parameters: IndexedElement[];
    returnType: IndexedElement | null;
    serviceState: IndexedElement[];
  };
  entities: {
    id: string;
    name: string;
    base: string | null;
    source: ModelSource | null;
    features: IndexedFeature[];
    effectiveFeatureIds: string[];
  }[];
  enumerations: {
    id: string;
    name: string;
    declarations: {elementId: string; literals: string[]}[];
    conflicting: boolean;
  }[];
  environment: {name: string; type: string; readOnly: true}[];
  issues: ModelIndexIssue[];
};

export const parseModelType = (raw: string): IndexedType => {
  const value = raw.trim();
  if (['Integer', 'Real', 'String', 'Boolean', 'Date', 'LocalDate'].includes(value)) {
    return {raw, kind: 'primitive', name: value};
  }
  if (value === 'void') return {raw, kind: 'void', name: value};
  if (value.startsWith('Set(') && value.endsWith(')')) {
    return {raw, kind: 'set', element: parseModelType(value.slice(4, -1))};
  }
  const enumeration = /^([A-Za-z_]\w*)\s*\[\s*([A-Za-z_]\w*(?:\s*\|\s*[A-Za-z_]\w*)*)\s*\]$/.exec(
    value
  );
  if (enumeration) {
    return {
      raw,
      kind: 'enum',
      name: enumeration[1],
      literals: enumeration[2].split('|').map((item) => item.trim()),
    };
  }
  return /^[A-Za-z_]\w*$/.test(value)
    ? {raw, kind: 'named', name: value}
    : {raw, kind: 'unsupported'};
};

// Index declarations only: never inspect reference clauses, tests, or inferred business rules.
export const buildModelIndex = (param: {
  project: string;
  entities: Record<string, Entity>;
  useCaseKey: string;
  useCase: UseCase;
  operationName: string;
  resolveSource?: (origin: ModelOrigin) => ModelSource | null;
}): ModelIndex => {
  const {project, useCaseKey, useCase, entities: catalog} = param;
  const service = useCase.relatedService;
  const operation = service.operations.find((item) => item.name === param.operationName);
  if (!operation)
    throw new Error(`Unknown operation: ${project}/${useCaseKey}/${param.operationName}`);
  const prefix = `${project}/use-case/${useCaseKey}/operation/${operation.name}`;
  const issues: ModelIndexIssue[] = [];
  const report = (code: string, elementIds: string[], message: string) =>
    issues.push({code, elementIds, message});
  const source = (origin: Omit<ModelOrigin, 'useCase' | 'operation'>) =>
    param.resolveSource?.({...origin, useCase: useCaseKey, operation: operation.name}) ?? null;
  const enumDeclarations = new Map<string, ModelIndex['enumerations'][number]>();
  const element = (
    id: string,
    name: string,
    raw: string,
    origin: Omit<ModelOrigin, 'useCase' | 'operation'>
  ): IndexedElement => {
    const type = parseModelType(raw);
    const registerEnums = (current: IndexedType) => {
      if (current.kind === 'set') registerEnums(current.element!);
      if (current.kind !== 'enum') return;
      const enumeration = enumDeclarations.get(current.name!) || {
        id: `${project}/enumeration/${current.name}`,
        name: current.name!,
        declarations: [],
        conflicting: false,
      };
      enumeration.declarations.push({elementId: id, literals: current.literals!});
      enumDeclarations.set(enumeration.name, enumeration);
      if (new Set(current.literals).size !== current.literals!.length) {
        report('DUPLICATE_ENUM_LITERAL', [id], `Repeated literal in ${raw}`);
      }
    };
    registerEnums(type);
    return {id, name, type, source: source(origin)};
  };
  const serviceState: IndexedElement[] = [];
  for (const [stateService, systemState] of [
    [service, false],
    [useCase.systemService, true],
  ] as const) {
    for (const variable of stateService.tempVariables || []) {
      const id = `${prefix}/state/${systemState ? 'system' : 'local'}/${variable.name}`;
      serviceState.push(
        element(id, variable.name, variable.type, {
          kind: 'state',
          owner: stateService.name,
          name: variable.name,
          service: stateService.name,
          systemState,
        })
      );
    }
  }
  const entities = Object.values(catalog).map((entity) => ({
    id: `${project}/entity/${entity.name}`,
    name: entity.name,
    base: entity.extends?.name ?? null,
    source: source({kind: 'entity', owner: entity.name, name: entity.name}),
    features: [
      ...entity.attributes.map(
        (attribute): IndexedFeature => ({
          ...element(
            `${project}/entity/${entity.name}/attribute/${attribute.name}`,
            attribute.name,
            attribute.type,
            {kind: 'attribute', owner: entity.name, name: attribute.name}
          ),
          kind: 'attribute',
          owner: entity.name,
        })
      ),
      ...(entity.relationships || []).map(
        (association): IndexedFeature => ({
          ...element(
            `${project}/entity/${entity.name}/association/${association.name}`,
            association.name,
            association.relatedEntity,
            {kind: 'association', owner: entity.name, name: association.name}
          ),
          kind: 'association',
          owner: entity.name,
          associationType: association.associationType,
        })
      ),
    ],
    effectiveFeatureIds: [] as string[],
  }));
  const parameters = (operation.parameters || []).map((parameter) =>
    element(`${prefix}/parameter/${parameter.name}`, parameter.name, parameter.type, {
      kind: 'parameter',
      owner: operation.name,
      name: parameter.name,
    })
  );
  const returnType = operation.returnType
    ? element(`${prefix}/return`, 'result', operation.returnType.type, {
        kind: 'return',
        owner: operation.name,
        name: 'result',
      })
    : null;
  const byName = new Map(entities.map((entity) => [entity.name, entity]));
  for (const [key, entity] of Object.entries(catalog)) {
    if (key !== entity.name)
      report(
        'CATALOG_KEY_MISMATCH',
        [`${project}/entity/${entity.name}`],
        `Catalog key ${key} differs from declared entity ${entity.name}`
      );
  }
  if (byName.size !== entities.length) report('DUPLICATE_ENTITY', [], 'Duplicate entity names');
  const effective = (name: string, stack: string[]): Map<string, IndexedFeature> => {
    if (stack.includes(name)) {
      report(
        'INHERITANCE_CYCLE',
        stack.map((item) => `${project}/entity/${item}`),
        `Cyclic inheritance: ${[...stack, name].join(' -> ')}`
      );
      return new Map();
    }
    const entity = byName.get(name);
    if (!entity) {
      report('UNKNOWN_BASE', [], `Unknown base entity ${name}`);
      return new Map();
    }
    const features = entity.base
      ? effective(entity.base, [...stack, name])
      : new Map<string, IndexedFeature>();
    const localNames = new Set<string>();
    for (const feature of entity.features) {
      if (localNames.has(feature.name))
        report('DUPLICATE_FEATURE', [feature.id], `Repeated ${name}.${feature.name}`);
      const inherited = features.get(feature.name);
      if (
        inherited &&
        inherited.owner !== name &&
        (inherited.type.raw !== feature.type.raw || inherited.kind !== feature.kind)
      ) {
        report(
          'INHERITED_FEATURE_CONFLICT',
          [inherited.id, feature.id],
          `Conflicting inherited feature ${name}.${feature.name}`
        );
      }
      features.set(feature.name, feature);
      localNames.add(feature.name);
    }
    return features;
  };
  for (const entity of entities)
    entity.effectiveFeatureIds = [...effective(entity.name, []).values()].map((f) => f.id);
  for (const enumeration of enumDeclarations.values()) {
    const variants = new Set(
      enumeration.declarations.map((d) => JSON.stringify([...d.literals].sort()))
    );
    enumeration.conflicting = variants.size > 1;
    if (enumeration.conflicting)
      report(
        'ENUM_DECLARATION_CONFLICT',
        enumeration.declarations.map((d) => d.elementId),
        `Incompatible literal sets for ${enumeration.name}`
      );
    if (byName.has(enumeration.name))
      report('TYPE_NAME_COLLISION', [enumeration.id], `Entity and enum share ${enumeration.name}`);
  }
  const allElements = [
    ...entities.flatMap((entity) => entity.features),
    ...serviceState,
    ...parameters,
    ...(returnType ? [returnType] : []),
  ];
  const checkType = (type: IndexedType, id: string): void => {
    if (type.kind === 'set') return checkType(type.element!, id);
    if (type.kind === 'unsupported')
      report('UNSUPPORTED_TYPE_DECLARATION', [id], `Unsupported declaration ${type.raw}`);
    if (type.kind === 'named' && !byName.has(type.name!) && !enumDeclarations.has(type.name!)) {
      report('UNRESOLVED_TYPE', [id], `Undeclared type ${type.name}`);
    }
    if (type.kind === 'void' && id !== returnType?.id)
      report('VOID_VALUE_TYPE', [id], 'void is only valid as a return type');
  };
  for (const item of allElements) checkType(item.type, item.id);
  for (const items of [parameters, serviceState]) {
    const seen = new Map<string, IndexedElement>();
    for (const item of items) {
      const previous = seen.get(item.name);
      if (previous && (items === parameters || previous.type.raw !== item.type.raw)) {
        report(
          items === parameters ? 'DUPLICATE_PARAMETER' : 'SERVICE_STATE_CONFLICT',
          [previous.id, item.id],
          `Conflicting declaration for ${item.name}`
        );
      }
      seen.set(item.name, item);
    }
  }
  return {
    schemaVersion: MODEL_INDEX_VERSION,
    project,
    useCase: useCaseKey,
    operation: {
      id: prefix,
      name: operation.name,
      service: service.name,
      source: source({kind: 'operation', owner: service.name, name: operation.name}),
      parameters,
      returnType,
      serviceState,
    },
    entities,
    enumerations: [...enumDeclarations.values()],
    environment: ['Today', 'Now'].map((name) => ({name, type: 'Date', readOnly: true as const})),
    issues,
  };
};
