import * as projects from '@/rm2pt/project';
import type {UseCase} from '@/rm2pt/model/UseCase';
import {buildModelIndex} from './modelIndex';
import {createModelGroundingRules} from './modelGroundingRules';
import {readModelSources} from './modelSources';

export const createOperationModelGrounding = (param: {
  project: keyof typeof projects;
  useCase: string;
  operation: string;
}) => {
  const project = projects[param.project];
  const useCase = (project?.useCase as Record<string, UseCase> | undefined)?.[param.useCase];
  if (!useCase) throw new Error(`Unknown model context: ${param.project}/${param.useCase}`);
  const index = buildModelIndex({
    project: param.project,
    entities: project.entity,
    useCaseKey: param.useCase,
    useCase,
    operationName: param.operation,
    resolveSource: readModelSources(process.cwd(), param.project).resolve,
  });
  return {index, rules: createModelGroundingRules(index)};
};

export type OperationModelGrounding = ReturnType<typeof createOperationModelGrounding>;
