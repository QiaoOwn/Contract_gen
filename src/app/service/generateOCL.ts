import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
import {ExtractStreamType, ProjectParam} from '../type';
import {graph as feedbackGraph} from './graph';
import {graph as linearGraph} from './graph-line';
import {OpenAIChatModelId} from '@langchain/openai';
export type GenerateOCLResult = ExtractStreamType<Awaited<ReturnType<typeof generateOCL>>>;
export type GenerateOCLGraphMode = 'feedback' | 'linear';
export type GenerateOCLFeedbackMode = 'full' | 'generic' | 'none';
export type GenerateOCLParam = {
  apiKey: string;
  operation: string;
  model: OpenAIChatModelId;
  userInput?: string;
  graphMode?: GenerateOCLGraphMode;
  feedbackMode?: GenerateOCLFeedbackMode;
  graph?: typeof feedbackGraph | typeof linearGraph;
} & ProjectParam;
export const generateOCL = async (param: GenerateOCLParam) => {
  const {
    project: key,
    useCase: uc,
    operation: op,
    model,
    userInput,
    graphMode = 'feedback',
    feedbackMode = graphMode === 'linear' ? 'none' : 'full',
    graph,
  } = param;
  const g = graph ?? (graphMode === 'linear' ? linearGraph : feedbackGraph);
  const p = project[key];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const graphInput = {
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
  };
  const feedbackGraphInput = {
    ...graphInput,
    feedbackMode,
  };
  const stream = await g.stream(
    graphMode === 'linear' ? graphInput : feedbackGraphInput,
    {
      configurable: {
        thread_id: new Date().getTime(),
      },
      recursionLimit: 50,
    }
  );
  return stream;
};
