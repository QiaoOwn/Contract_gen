import {BaseMessage, HumanMessage} from '@langchain/core/messages';
import {ChatOpenAI, OpenAIChatModelId} from '@langchain/openai';
import {z} from 'zod';

export type OclParts = {
  definition: string;
  precondition: string;
  postcondition: string;
};

type GenerateOclWithJsonModeParam = {
  model: OpenAIChatModelId;
  apiKey: string;
  baseURL: string;
  messages: BaseMessage[];
  schema: z.ZodType<{
    definition: string | null;
    precondition: string;
    postcondition: string;
  }>;
};

const getOclOutputMode = () => {
  const mode = (process.env.OCL_OUTPUT_MODE ?? process.env.OCL_STRUCTURED_OUTPUT_MODE ?? 'json')
    .trim()
    .toLowerCase();
  if (mode === 'structured' || mode === 'json' || mode === 'auto') {
    return mode;
  }
  if (mode === 'fallback') {
    return 'json';
  }
  return 'json';
};

const normalizeOcl = (ocl: {
  definition: string | null;
  precondition: string;
  postcondition: string;
}): OclParts => ({
  definition: ocl.definition ?? '',
  precondition: ocl.precondition,
  postcondition: ocl.postcondition,
});

const messageContentToString = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as {text: unknown}).text);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return String(content ?? '');
};

const extractJsonObject = (content: string) => {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? content;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('JSON output response did not contain a JSON object.');
  }
  return candidate.slice(start, end + 1);
};

const createChatModel = (
  param: Pick<GenerateOclWithJsonModeParam, 'model' | 'apiKey' | 'baseURL'>
) =>
  new ChatOpenAI({
    model: param.model,
    apiKey: param.apiKey,
    configuration: {baseURL: param.baseURL},
  });

const generateWithStructuredOutput = async (param: GenerateOclWithJsonModeParam) => {
  const ocl = (await createChatModel(param)
    .withStructuredOutput(param.schema)
    .invoke(param.messages)) as {
    definition: string | null;
    precondition: string;
    postcondition: string;
  };
  return normalizeOcl(ocl);
};

const generateWithJsonOutput = async (param: GenerateOclWithJsonModeParam) => {
  const response = await createChatModel(param).invoke([
    ...param.messages,
    new HumanMessage(
      [
        'Return only one valid JSON object. Do not use markdown.',
        'The object must have exactly these keys: definition, precondition, postcondition.',
        'Use an empty string for definition when no definition is needed.',
      ].join('\n')
    ),
  ]);
  const content = messageContentToString(response.content);
  const parsed = JSON.parse(extractJsonObject(content));
  const ocl = param.schema.parse(parsed) as {
    definition: string | null;
    precondition: string;
    postcondition: string;
  };
  return normalizeOcl(ocl);
};

export const generateOclWithJsonMode = async (param: GenerateOclWithJsonModeParam) => {
  const mode = getOclOutputMode();
  if (mode === 'json') {
    return generateWithJsonOutput(param);
  }
  if (mode === 'structured') {
    return generateWithStructuredOutput(param);
  }
  try {
    return await generateWithStructuredOutput(param);
  } catch (error) {
    console.warn(
      `[OCL Generator] structured output failed for ${param.model}; retrying with JSON output.`,
      error
    );
    return generateWithJsonOutput(param);
  }
};
