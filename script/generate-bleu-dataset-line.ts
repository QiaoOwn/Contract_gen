import fs from 'fs-extra';
import path from 'path';
import * as project from '@/rm2pt/project';
import {ProjectParam} from '@/app/type';
import {UseCase} from '@/rm2pt/model/UseCase';
import {OpenAIChatModelId} from '@langchain/openai';
import {GenerateOCLResult} from '@/app/service/generateOCL';
type Result = Partial<{
  [K in OpenAIChatModelId]: {
    [k: string]: {
      ocl: string;
      candidate: string;
      service: string;
      useCase: string;
      operation: string;
    }[];
  };
}>;
enum Level {
  TestPass,
  TestFail,
  TypescriptGeneratedWithErrors,
  ContractGeneratedWithErrors,
}
export const generateBleuDataset = () => {
  const result: Result = {};
  const passed: {[k: string]: Level} = {};
  const experimentFolder = path.resolve(process.cwd(), 'experiment-line');
  const files = fs.readdirSync(experimentFolder).filter((file) => !file.startsWith('checkpoint'));
  for (const file of files) {
    const filePath = path.join(experimentFolder, file);
    const experimentResult: GenerateOCLResult[] = fs.readJSONSync(filePath, {throws: false});
    const [, op, uc, key, ...rest] = file.split('-').reverse() as [
      undefined,
      string,
      string,
      ProjectParam['project'],
      OpenAIChatModelId,
    ];
    const model = rest.reverse().join('-') as OpenAIChatModelId;
    if (!result[model]) {
      result[model] = {};
    }
    const k = `${key}-${uc}-${op}`;
    if (!result[model][k]) {
      result[model][k] = [];
    }
    const mk = `${model}-${k}`;
    if (passed[mk] === Level.TestPass) {
      continue;
    }
    const p = project[key];
    const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
    const service = useCase.relatedService;
    const operation = service.operations.find((o) => o.name === op)!;
    const testPassResult = experimentResult.find((e) => e['Test Result']?.result?.numPassingTests);
    if (testPassResult) {
      result[model][k] = [];
      const index = experimentResult.findIndex((e) => e === testPassResult);
      const arr = experimentResult.slice(0, index + 1).reverse();
      const ocl = arr.find((e) => e['OCL Generator']?.ocl)!['OCL Generator']!.ocl!;
      if (operation.definition && ocl!.definition) {
        result[model][k].push({
          ocl: operation.definition,
          candidate: ocl.definition,
          service: service.name,
          useCase: uc,
          operation: operation.name,
        });
      }
      result[model][k].push({
        ocl: operation.precondition,
        candidate: ocl.precondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      result[model][k].push({
        ocl: operation.postcondition,
        candidate: ocl.postcondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      passed[mk] = Level.TestPass;
      continue;
    }
    if (passed[mk] === Level.TestFail) {
      continue;
    }
    const testFailedResult = experimentResult.find(
      (e) => e['Test Result']?.result?.numFailingTests
    );
    if (testFailedResult) {
      result[model][k] = [];
      const index = experimentResult.findIndex((e) => e === testFailedResult);
      const arr = experimentResult.slice(0, index + 1).reverse();
      const ocl = arr.find((e) => e['OCL Generator']?.ocl)!['OCL Generator']!.ocl!;
      if (operation.definition && ocl!.definition) {
        result[model][k].push({
          ocl: operation.definition,
          candidate: ocl.definition,
          service: service.name,
          useCase: uc,
          operation: operation.name,
        });
      }
      result[model][k].push({
        ocl: operation.precondition,
        candidate: ocl.precondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      result[model][k].push({
        ocl: operation.postcondition,
        candidate: ocl.postcondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      passed[mk] = Level.TestFail;
      continue;
    }
    if (passed[mk] === Level.TypescriptGeneratedWithErrors) {
      continue;
    }
    const typescriptGeneratedWithErrors = experimentResult.find(
      (e) => e['TypeScript Generator']?.typescriptErrors?.length
    );
    if (typescriptGeneratedWithErrors) {
      result[model][k] = [];
      const index = experimentResult.findIndex((e) => e === typescriptGeneratedWithErrors);
      const arr = experimentResult.slice(0, index + 1).reverse();
      const ocl = arr.find((e) => e['OCL Generator']?.ocl)!['OCL Generator']!.ocl!;
      if (operation.definition && ocl!.definition) {
        result[model][k].push({
          ocl: operation.definition,
          candidate: ocl.definition,
          service: service.name,
          useCase: uc,
          operation: operation.name,
        });
      }
      result[model][k].push({
        ocl: operation.precondition,
        candidate: ocl.precondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      result[model][k].push({
        ocl: operation.postcondition,
        candidate: ocl.postcondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      passed[mk] = Level.TypescriptGeneratedWithErrors;
      continue;
    }
    if (passed[mk] === Level.ContractGeneratedWithErrors) {
      continue;
    }
    const contractGeneratedWithErrors = experimentResult.find(
      (e) => e['Contract Generator']?.contractErrors?.length
    );
    if (contractGeneratedWithErrors) {
      result[model][k] = [];
      const index = experimentResult.findIndex((e) => e === contractGeneratedWithErrors);
      const arr = experimentResult.slice(0, index + 1).reverse();
      const ocl = arr.find((e) => e['OCL Generator']?.ocl)!['OCL Generator']!.ocl!;
      if (operation.definition && ocl!.definition) {
        result[model][k].push({
          ocl: operation.definition,
          candidate: ocl.definition,
          service: service.name,
          useCase: uc,
          operation: operation.name,
        });
      }
      result[model][k].push({
        ocl: operation.precondition,
        candidate: ocl.precondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      result[model][k].push({
        ocl: operation.postcondition,
        candidate: ocl.postcondition,
        service: service.name,
        useCase: uc,
        operation: operation.name,
      });
      passed[mk] = Level.ContractGeneratedWithErrors;
    }
  }
  const dir = path.resolve(process.cwd(), 'bleu-dataset-line');
  fs.ensureDirSync(dir);
  Object.entries(result).forEach(([model, data]) => {
    const filePath = path.resolve(dir, `${model}.json`);
    fs.ensureFileSync(filePath);
    const json: {
      ocl: string;
      candidate: string;
    }[] = [];
    Object.entries(data!).forEach(([, oclData]) => {
      json.push(...oclData);
    });
    fs.writeJSON(filePath, json, {spaces: 2});
  });
};
generateBleuDataset();
