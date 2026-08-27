import fs from 'fs-extra';
import path from 'path';
import * as project from '@/rm2pt/project';
import {ProjectParam} from '../type';
import {l as rougeL} from 'js-rouge';
import {UseCase} from '@/rm2pt/model/UseCase';
import {OpenAIChatModelId} from '@langchain/openai';
import {GenerateOCLResult} from './generateOCL';
type ModelId = OpenAIChatModelId | 'DeepOCL' | 'Codex Prompt' | 'PathOCL';

const safeRougeL = (candidate: string, reference: string) => {
  try {
    const score = rougeL(candidate, reference, {});
    return Number.isFinite(score) ? score : Number.NaN;
  } catch {
    return Number.NaN;
  }
};

export const generateExperimentResult = () => {
  const result: Partial<
    Record<
      ModelId,
      Partial<
        Record<
          ProjectParam['project'],
          Partial<
            Record<
              string,
              Partial<
                Record<
                  string,
                  Partial<
                    Record<keyof GenerateOCLResult, boolean> & {
                      rougeL: {definition?: number; precondition?: number; postcondition?: number};
                    }
                  >
                >
              >
            >
          >
        >
      >
    >
  > = {};
  let aggregated: Partial<
    Record<
      ModelId,
      Omit<
        Record<keyof GenerateOCLResult, number> & {
          rougeL: number;
          validity: number;
          correctness: number;
        },
        '__start__'
      >
    >
  > = {};
  const rougeCount: Partial<Record<OpenAIChatModelId, number>> = {};
  const experimentFolder = path.resolve(process.cwd(), 'experiment');
  const files = fs.readdirSync(experimentFolder).filter((file) => !file.startsWith('checkpoint'));
  for (const file of files) {
    const filePath = path.join(experimentFolder, file);
    const [, op, uc, key, ...rest] = file.split('-').reverse() as [
      undefined,
      string,
      string,
      ProjectParam['project'],
      OpenAIChatModelId,
    ];
    const model = rest.reverse().join('-') as OpenAIChatModelId;
    const p = project[key];
    const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
    const service = useCase.relatedService;
    const operation = service.operations.find((o) => o.name === op)!;

    if (!aggregated[model]) {
      aggregated[model] = {
        'OCL Generator': 0,
        'Contract Generator': 0,
        'TypeScript Generator': 0,
        'TypeScript Parser': 0,
        'Test Result': 0,
        rougeL: 0,
        validity: 0,
        correctness: 0,
      };
    }
    if (!rougeCount[model]) {
      rougeCount[model] = 0;
    }
    if (!result[model]) {
      result[model] = {};
    }
    if (!result[model][key]) {
      result[model][key] = {};
    }
    if (!result[model][key][uc]) {
      result[model][key][uc] = {};
    }
    const experimentResult: GenerateOCLResult[] = fs.readJSONSync(filePath, {throws: false});
    let opResult = result[model][key][uc]![op];
    if (!opResult) {
      result[model][key][uc]![op] = {};
      opResult = result[model][key][uc]![op];
    }

    if (!opResult!['OCL Generator']) {
      const ocl = experimentResult.find((s) => s['OCL Generator']?.ocl)?.['OCL Generator'].ocl;
      opResult!['OCL Generator'] = !!ocl;
      if (opResult!['OCL Generator']) {
        if (!opResult!['rougeL']) {
          opResult!['rougeL'] = {};
        }
        if (ocl?.definition && operation.definition) {
          const r = safeRougeL(ocl.definition, operation.definition);
          opResult!['rougeL']!.definition = r;
          if (!Number.isNaN(r)) {
            rougeCount[model]!++;
            aggregated[model]!['rougeL']! += r;
          }
        }
        if (ocl?.precondition && operation.precondition) {
          const r = safeRougeL(ocl.precondition, operation.precondition);
          opResult!['rougeL']!.precondition = r;
          if (!Number.isNaN(r)) {
            rougeCount[model]!++;
            aggregated[model]!['rougeL']! += r;
          }
        }
        if (ocl?.postcondition && operation.postcondition) {
          const r = safeRougeL(ocl.postcondition, operation.postcondition);
          opResult!['rougeL']!.postcondition = r;
          if (!Number.isNaN(r)) {
            rougeCount[model]!++;
            aggregated[model]!['rougeL']! += r;
          }
        }
      }
      aggregated[model]!['OCL Generator']!++;
    } else {
    }

    if (!opResult!['Contract Generator']) {
      opResult!['Contract Generator'] = experimentResult.some(
        (s) => s['Contract Generator']?.contractErrors?.length === 0
      );
      if (opResult!['Contract Generator']) {
        aggregated[model]!['Contract Generator']!++;
      }
    }
    if (!opResult!['TypeScript Generator']) {
      opResult!['TypeScript Generator'] = experimentResult.some(
        (s) => s['TypeScript Generator']?.typescriptErrors?.length === 0
      );
      if (opResult!['TypeScript Generator']) {
        aggregated[model]!['TypeScript Generator']!++;
      }
    }
    if (!opResult!['TypeScript Parser']) {
      opResult!['TypeScript Parser'] = experimentResult.some(
        (s) => s['TypeScript Parser']?.typescriptErrors?.length === 0
      );
      if (opResult!['TypeScript Parser']) {
        aggregated[model]!['TypeScript Parser']!++;
      }
    }
    if (!opResult!['Test Result']) {
      opResult!['Test Result'] = experimentResult.some(
        (s) => s['Test Result']?.result?.numPassingTests
      );
      if (opResult!['Test Result']) {
        aggregated[model]!['Test Result']!++;
      }
    }
  }
  for (const model of Object.keys(aggregated)) {
    aggregated[model]!['rougeL'] = parseFloat(
      ((aggregated[model]!['rougeL'] * 100) / rougeCount[model]!).toFixed(2)
    );
    aggregated[model]!['validity'] = parseFloat(
      ((aggregated[model]!['TypeScript Parser'] * 100) / 114).toFixed(2)
    );
    aggregated[model]!['correctness'] = parseFloat(
      ((aggregated[model]!['Test Result'] * 100) / 114).toFixed(2)
    );
  }
  aggregated = {
    DeepOCL: {
      'OCL Generator': 0,
      'Contract Generator': 0,
      'TypeScript Generator': 0,
      'TypeScript Parser': 0,
      'Test Result': 0,
      rougeL: 18.31,
      validity: 0,
      correctness: 0,
    },
    PathOCL: {
      'OCL Generator': 0,
      'Contract Generator': 0,
      'TypeScript Generator': 0,
      'TypeScript Parser': 0,
      'Test Result': 0,
      rougeL: 0,
      validity: 61.9,
      correctness: 47.6,
    },
    'Codex Prompt': {
      'OCL Generator': 0,
      'Contract Generator': 0,
      'TypeScript Generator': 0,
      'TypeScript Parser': 0,
      'Test Result': 0,
      rougeL: 0,
      validity: 53.2,
      correctness: 39,
    },
    ...aggregated,
  };
  return {result, aggregated};
};

export const generateAblationStudyExperimentResult = () => {
  const result: Partial<
    Record<
      ModelId,
      Partial<
        Record<
          ProjectParam['project'],
          Partial<
            Record<
              string,
              Partial<Record<string, Partial<Record<keyof GenerateOCLResult, boolean>>>>
            >
          >
        >
      >
    >
  > = {};
  let aggregated: Partial<
    Record<
      ModelId,
      Omit<
        Record<keyof GenerateOCLResult, number> & {
          validity: number;
          correctness: number;
        },
        '__start__'
      >
    >
  > = {};
  const rougeCount: Partial<Record<OpenAIChatModelId, number>> = {};
  const experimentFolder = path.resolve(process.cwd(), 'experiment-line');
  const files = fs.readdirSync(experimentFolder).filter((file) => !file.startsWith('checkpoint'));
  for (const file of files) {
    const filePath = path.join(experimentFolder, file);
    const [, op, uc, key, ...rest] = file.split('-').reverse() as [
      undefined,
      string,
      string,
      ProjectParam['project'],
      OpenAIChatModelId,
    ];
    const model = rest.reverse().join('-') as OpenAIChatModelId;

    if (!aggregated[model]) {
      aggregated[model] = {
        'OCL Generator': 0,
        'Contract Generator': 0,
        'TypeScript Generator': 0,
        'TypeScript Parser': 0,
        'Test Result': 0,
        validity: 0,
        correctness: 0,
      };
    }
    if (!rougeCount[model]) {
      rougeCount[model] = 0;
    }
    if (!result[model]) {
      result[model] = {};
    }
    if (!result[model][key]) {
      result[model][key] = {};
    }
    if (!result[model][key][uc]) {
      result[model][key][uc] = {};
    }
    const experimentResult: GenerateOCLResult[] = fs.readJSONSync(filePath, {throws: false});
    let opResult = result[model][key][uc]![op];
    if (!opResult) {
      result[model][key][uc]![op] = {};
      opResult = result[model][key][uc]![op];
    }

    if (!opResult!['OCL Generator']) {
      const ocl = experimentResult.find((s) => s['OCL Generator']?.ocl)?.['OCL Generator'].ocl;
      opResult!['OCL Generator'] = !!ocl;
      aggregated[model]!['OCL Generator']!++;
    } else {
    }

    if (!opResult!['Contract Generator']) {
      opResult!['Contract Generator'] = experimentResult.some(
        (s) => s['Contract Generator']?.contractErrors?.length === 0
      );
      if (opResult!['Contract Generator']) {
        aggregated[model]!['Contract Generator']!++;
      }
    }
    if (!opResult!['TypeScript Generator']) {
      opResult!['TypeScript Generator'] = experimentResult.some(
        (s) => s['TypeScript Generator']?.typescriptErrors?.length === 0
      );
      if (opResult!['TypeScript Generator']) {
        aggregated[model]!['TypeScript Generator']!++;
      }
    }
    if (!opResult!['TypeScript Parser']) {
      opResult!['TypeScript Parser'] = experimentResult.some(
        (s) => s['TypeScript Parser']?.typescriptErrors?.length === 0
      );
      if (opResult!['TypeScript Parser']) {
        aggregated[model]!['TypeScript Parser']!++;
      }
    }
    if (!opResult!['Test Result']) {
      opResult!['Test Result'] =
        experimentResult.some((s) => s['Test Result']?.result?.numPassingTests) &&
        experimentResult.some((s) => s['Contract Generator']?.contractErrors?.length === 0) &&
        experimentResult.some((s) => s['TypeScript Parser']?.typescriptErrors?.length === 0);

      if (opResult!['Test Result']) {
        aggregated[model]!['Test Result']!++;
      }
    }
  }
  for (const model of Object.keys(aggregated)) {
    aggregated[model]!['validity'] = parseFloat(
      ((aggregated[model]!['TypeScript Parser'] * 100) / 114).toFixed(2)
    );
    aggregated[model]!['correctness'] = parseFloat(
      ((aggregated[model]!['Test Result'] * 100) / 114).toFixed(2)
    );
  }
  aggregated = {
    PathOCL: {
      'OCL Generator': 0,
      'Contract Generator': 0,
      'TypeScript Generator': 0,
      'TypeScript Parser': 0,
      'Test Result': 0,
      validity: 61.9,
      correctness: 47.6,
    },
    'Codex Prompt': {
      'OCL Generator': 0,
      'Contract Generator': 0,
      'TypeScript Generator': 0,
      'TypeScript Parser': 0,
      'Test Result': 0,
      validity: 53.2,
      correctness: 39,
    },
    ...aggregated,
  };
  return {result, aggregated};
};
