import type {ModelIndex} from './modelIndex';

export const modelDeclarations = (index: ModelIndex) => [
  ...index.entities.flatMap((entity) => [
    {name: entity.name, id: entity.id, declaration: entity.name, source: entity.source},
    ...entity.features.map((feature) => ({
      name: `${entity.name}.${feature.name}`,
      id: feature.id,
      declaration: `${entity.name}.${feature.name}: ${feature.type.raw}`,
      source: feature.source,
    })),
  ]),
  ...index.operation.parameters.map((parameter) => ({
    name: `$parameter.${parameter.name}`,
    id: parameter.id,
    declaration: `parameter ${parameter.name}: ${parameter.type.raw}`,
    source: parameter.source,
  })),
  ...index.operation.serviceState.map((state) => ({
    name: `self.${state.name}`,
    id: state.id,
    declaration: `self.${state.name}: ${state.type.raw}`,
    source: state.source,
  })),
  ...(index.operation.returnType
    ? [
        {
          name: '$result',
          id: index.operation.returnType.id,
          declaration: `result: ${index.operation.returnType.type.raw}`,
          source: index.operation.returnType.source,
        },
      ]
    : []),
];
