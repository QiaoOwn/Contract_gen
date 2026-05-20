import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
import {ExtractStreamType, ProjectParam} from '../type';
import {graph} from './graph';
import {OpenAIChatModelId} from '@langchain/openai';
export type GenerateOCLResult = ExtractStreamType<Awaited<ReturnType<typeof generateOCL>>>;
export type GenerateOCLParam = {
  apiKey: string;
  operation: string;
  model: OpenAIChatModelId;
  userInput?: string;
  graph?: typeof graph;
} & ProjectParam;
export const generateOCL = async (param: GenerateOCLParam) => {
  const {project: key, useCase: uc, operation: op, model, userInput, graph: g = graph} = param;
  const p = project[key];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const stream = await g.stream(
    {
      ...param,
      model,
      messages: [
        {
          role: 'user',
          content: [
            `The operation description is: `,
            userInput?.trim() || operation.description,
            operation.parameters?.length ? `The contract input parameters are:` : undefined,
            operation.parameters?.map((e) => `Name: ${e.name} Type: ${e.type}`).join('\n'),
            operation.returnType
              ? `The return type of the contract is: ${operation.returnType.type}`
              : undefined,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    },
    {
      configurable: {
        thread_id: new Date().getTime(),
      },
      recursionLimit: 50,
    }
  );
  return stream;
};
