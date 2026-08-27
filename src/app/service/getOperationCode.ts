import 'server-only';
import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
import {formatContract, formatTypescript, generateContractCode, parse} from '../util';
import {
  generateTypescriptEntityFile,
  generateTypescriptServiceFile,
} from './generateTypescriptCode';
import generate from '@babel/generator';
import fs from 'fs';
import * as babel from '@babel/core';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import {createProjectContextPrompt} from './createProjectContextPrompt';
import {graph} from './graph';
import type {GetOperationCodeParams} from './operationCodeShared';
import {removeFileExportsAndImports} from './operationCodeShared';

export type {GetOperationCodeParams} from './operationCodeShared';
export {removeFileExportsAndImports} from './operationCodeShared';

export default async function getOperationCode(params: GetOperationCodeParams) {
  const {
    project: key,
    useCase: uc,
    operation: op,
    removeExports = true,
    includeGraphImage = true,
  } = params;
  const p = project[key];
  const entity = p.entity;
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const serviceName = service.name;
  const operationName = operation.name;
  const returnType = operation.returnType?.type;
  const parameters = operation.parameters || [];
  const precondition = operation.precondition;
  const postcondition = operation.postcondition;
  const definition = operation.definition;
  const code = generateContractCode({
    serviceName,
    operationName,
    parameters,
    returnedType: returnType,
    definition,
    precondition,
    postcondition,
  });

  const {tree, tokens} = parse(code);
  const entityFile = generateTypescriptEntityFile(entity, service);

  const {file: serviceFile, counter: c2tCounter} = generateTypescriptServiceFile(service, [
    operation,
  ]);

  const logicFormulaBuilderFile = babel.parse(
    fs.readFileSync(`${process.cwd()}/public/LogicFormulaBuilder.ts`, 'utf-8'),
    {filename: 'LogicFormulaBuilder.ts', presets: [presetTypescript]}
  )!;

  const standardOPsFile = babel.parse(
    fs.readFileSync(`${process.cwd()}/public/StandardOPs.ts`, 'utf-8'),
    {filename: 'StandardOPs.ts', presets: [presetTypescript]}
  )!;

  const preconditionErrorFile = babel.parse(
    fs.readFileSync(`${process.cwd()}/public/PreconditionError.ts`, 'utf-8'),
    {filename: 'PreconditionError.ts', presets: [presetTypescript]}
  )!;
  const fileKey = `${key}-${serviceName}-${operationName}`;
  const testFile = babel.parse(
    fs.readFileSync(`${process.cwd()}/test/${fileKey}/index.test.ts`, 'utf-8'),
    {filename: 'index.test.ts', presets: [presetTypescript]}
  )!;

  if (removeExports) {
    removeFileExportsAndImports(entityFile);
    removeFileExportsAndImports(serviceFile);
    removeFileExportsAndImports(logicFormulaBuilderFile);
    removeFileExportsAndImports(standardOPsFile);
    removeFileExportsAndImports(preconditionErrorFile);
    removeFileExportsAndImports(testFile);
  }
  let src = '';
  if (includeGraphImage) {
    try {
      const representation = await graph.getGraphAsync();
      const image = await representation.drawMermaidPng();
      const arrayBuffer = Buffer.from(await image.arrayBuffer());
      src = `data:image/jpeg;base64,${arrayBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Unable to render the optional workflow preview.', error);
    }
  }

  return {
    src,
    fileKey,
    projectName: key,
    serviceName,
    operationName,
    operationDescription: operation.description || '',
    contract: formatContract(tree!, tokens),
    typescript: {
      entity: await formatTypescript(generate(entityFile).code),
      service: await formatTypescript(generate(serviceFile).code.replaceAll(' End*/', ' End*/\n')),
      standardOPs: await formatTypescript(generate(standardOPsFile).code),
      dayjs: await formatTypescript(fs.readFileSync(`${process.cwd()}/public/dayjs.d.ts`, 'utf-8')),
      jest: await formatTypescript(fs.readFileSync(`${process.cwd()}/public/jest.d.ts`, 'utf-8')),
      logicFormulaBuilder: await formatTypescript(generate(logicFormulaBuilderFile).code),
      preconditionError: await formatTypescript(generate(preconditionErrorFile).code),
      arrayExtension: await formatTypescript(
        fs.readFileSync(`${process.cwd()}/public/ArrayExtension.ts`, 'utf-8')
      ),
      test: await formatTypescript(generate(testFile).code),
    },
    c2tCounter,
    context: createProjectContextPrompt({project: key, useCase: uc}),
  };
}
