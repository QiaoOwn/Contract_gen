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

export type OclGenerationUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
  finishReason: string | null;
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

const finiteNumberOrNull = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const extractUsage = (response: {
  response_metadata?: Record<string, unknown>;
  usage_metadata?: Record<string, unknown>;
}): OclGenerationUsage => {
  const usage = response.usage_metadata || {};
  const outputDetails =
    usage.output_token_details && typeof usage.output_token_details === 'object'
      ? (usage.output_token_details as Record<string, unknown>)
      : {};
  const responseTokenUsage =
    response.response_metadata?.tokenUsage &&
    typeof response.response_metadata.tokenUsage === 'object'
      ? (response.response_metadata.tokenUsage as Record<string, unknown>)
      : {};
  const inputTokens = finiteNumberOrNull(
    usage.input_tokens ?? responseTokenUsage.promptTokens ?? responseTokenUsage.prompt_tokens
  );
  const outputTokens = finiteNumberOrNull(
    usage.output_tokens ??
      responseTokenUsage.completionTokens ??
      responseTokenUsage.completion_tokens
  );
  return {
    inputTokens,
    outputTokens,
    totalTokens:
      finiteNumberOrNull(
        usage.total_tokens ?? responseTokenUsage.totalTokens ?? responseTokenUsage.total_tokens
      ) ?? (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null),
    reasoningTokens: finiteNumberOrNull(
      outputDetails.reasoning ?? responseTokenUsage.reasoningTokens
    ),
    finishReason:
      typeof response.response_metadata?.finish_reason === 'string'
        ? response.response_metadata.finish_reason
        : null,
  };
};

export class StructuredJsonOutputError extends Error {
  constructor(message: string, public readonly usage: OclGenerationUsage, public readonly content: string) {
    super(message);
    this.name = 'StructuredJsonOutputError';
  }
}

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

export const generateStructuredJsonDetailed = async <T>(param: {
  model: OpenAIChatModelId;
  apiKey: string;
  baseURL: string;
  messages: BaseMessage[];
  schema: z.ZodType<T>;
}) => {
  const response = await createChatModel(param).invoke(param.messages, {
    response_format: {type: 'json_object'},
  });
  const content = messageContentToString(response.content);
  const usage = extractUsage(response);
  try {
    const parsed = JSON.parse(extractJsonObject(content, createResponseDiagnostic(response)));
    return {value: param.schema.parse(parsed), usage};
  } catch (error) {
    throw new StructuredJsonOutputError(error instanceof Error ? error.message : String(error), usage, content);
  }
};

export const generateOclWithJsonModeDetailed = async (param: GenerateOclWithJsonModeParam) => {
  const result = await generateStructuredJsonDetailed(param);
  return {ocl: normalizeOcl(result.value), usage: result.usage};
};

export const generateOclWithJsonMode = async (param: GenerateOclWithJsonModeParam) => {
  return (await generateOclWithJsonModeDetailed(param)).ocl;
};
