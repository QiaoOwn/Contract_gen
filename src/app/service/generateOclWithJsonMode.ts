import {BaseMessage} from '@langchain/core/messages';
import {ChatOpenAI, OpenAIChatModelId} from '@langchain/openai';
import {z} from 'zod';
import {
  createModelReasoningKwargs,
  createOCLGenerationConfiguration,
} from './generationConfiguration';

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

const extractJsonObject = (content: string, diagnostic = '') => {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? content;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error(
      `JSON-mode response did not contain a JSON object${diagnostic ? ` (${diagnostic})` : ''}.`
    );
  }
  return candidate.slice(start, end + 1);
};

const createResponseDiagnostic = (response: {
  response_metadata?: Record<string, unknown>;
  usage_metadata?: {
    output_tokens?: number;
    output_token_details?: {reasoning?: number};
  };
}) => {
  const finishReason = response.response_metadata?.finish_reason ?? 'unknown';
  const outputTokens = response.usage_metadata?.output_tokens ?? 'unknown';
  const reasoningTokens = response.usage_metadata?.output_token_details?.reasoning ?? 'unknown';
  return `finish_reason=${finishReason}, output_tokens=${outputTokens}, reasoning_tokens=${reasoningTokens}`;
};

const createChatModel = (
  param: Pick<GenerateOclWithJsonModeParam, 'model' | 'apiKey' | 'baseURL'>
) => {
  const config = createOCLGenerationConfiguration();
  const modelKwargs = createModelReasoningKwargs(String(param.model));
  return new ChatOpenAI({
    model: param.model,
    apiKey: param.apiKey,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    ...(Object.keys(modelKwargs).length > 0 ? {modelKwargs} : {}),
    configuration: {baseURL: param.baseURL},
  });
};

const generateWithJsonOutput = async (param: GenerateOclWithJsonModeParam) => {
  const response = await createChatModel(param).invoke(param.messages, {
    response_format: {type: 'json_object'},
  });
  const content = messageContentToString(response.content);
  const parsed = JSON.parse(extractJsonObject(content, createResponseDiagnostic(response)));
  const ocl = param.schema.parse(parsed) as {
    definition: string | null;
    precondition: string;
    postcondition: string;
  };
  return normalizeOcl(ocl);
};

export const generateOclWithJsonMode = async (param: GenerateOclWithJsonModeParam) => {
  return generateWithJsonOutput(param);
};
