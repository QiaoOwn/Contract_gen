import {ExtractStreamType, ProjectParam} from '../type';
import {graph as feedbackGraph} from './graph';
import {graph as linearGraph} from './graph-line';
import {OpenAIChatModelId} from '@langchain/openai';
import {normalizeGenerationBudget, validateGenerationMode} from './generationBudget';
import {buildOperationInput} from './createOperationInput';
export type GenerateOCLResult = ExtractStreamType<Awaited<ReturnType<typeof generateOCL>>>;
export type GenerateOCLGraphMode = 'feedback' | 'linear' | 'paired';
export type GenerateOCLFeedbackMode = 'full' | 'generic' | 'none';
export type GenerateOCLParam = {
  apiKey: string;
  operation: string;
  model: OpenAIChatModelId;
  userInput?: string;
  graphMode?: GenerateOCLGraphMode;
  feedbackMode?: GenerateOCLFeedbackMode;
  maxGenerationAttempts?: number;
  initialOcl?: {
    definition: string;
    precondition: string;
    postcondition: string;
  };
  initialGenerationCount?: number;
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
    maxGenerationAttempts,
    initialOcl,
    initialGenerationCount,
    graph,
  } = param;
  validateGenerationMode(graphMode, feedbackMode, Boolean(initialOcl));
  const generationBudget = normalizeGenerationBudget(maxGenerationAttempts);
  const g = graph ?? (graphMode === 'linear' ? linearGraph : feedbackGraph);
  const seededGenerationCount = graphMode === 'paired' ? (initialGenerationCount ?? 1) : 0;
  if (seededGenerationCount < 0 || seededGenerationCount >= generationBudget) {
    throw new Error(
      `Invalid initialGenerationCount=${seededGenerationCount}; paired repair requires remaining generation budget.`
    );
  }
  const operationInput = buildOperationInput({
    project: key,
    useCase: uc,
    operation: op,
    userInput,
  });
  const graphInput = {
    ...param,
    model,
    maxGenerationAttempts: generationBudget,
    generationCount: seededGenerationCount,
    ...(initialOcl ? {ocl: initialOcl} : {}),
    inputMetadata: operationInput.metadata,
    messages: [
      {
        role: 'user',
        content: operationInput.content,
      },
    ],
  };
  const feedbackGraphInput = {
    ...graphInput,
    feedbackMode,
  };
  const stream = await g.stream(graphMode === 'linear' ? graphInput : feedbackGraphInput, {
    configurable: {
      thread_id: new Date().getTime(),
    },
    recursionLimit: generationBudget * 5 + 8,
  });
  return stream;
};
