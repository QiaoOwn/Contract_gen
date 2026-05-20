import {ProjectParam} from '@/app/type';
import {useParams} from 'next/navigation';

export const useGeneratorParams = () => {
  const {project, useCase, operation} = useParams<ProjectParam>();
  const entityPath = `${project}/entity.ts`;
  const standardOPsPath = 'StandardOPs.ts';
  const logicFormulaBuilderPath = 'LogicFormulaBuilder.ts';
  const preconditionErrorPath = 'PreconditionError.ts';
  const arrayExtensionPath = 'ArrayExtension.ts';
  const testPath = 'index.test.ts';
  const servicePath = `${project}/${useCase}/${operation}.ts`;
  const dayjsPath = 'node_modules/@types/dayjs/index.d.ts';
  return {
    project,
    useCase,
    operation,
    entityPath,
    standardOPsPath,
    logicFormulaBuilderPath,
    preconditionErrorPath,
    arrayExtensionPath,
    testPath,
    servicePath,
    dayjsPath,
  };
};
