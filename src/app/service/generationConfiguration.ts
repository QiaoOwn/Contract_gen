import {createHash} from 'crypto';

export const OCL_GENERATION_CONFIG_VERSION = 'llm-generation-config-v5';

const reasoningPolicy = {
  gpt5ReasoningEffort: 'none',
  gemini35FlashThinkingLevel: 'minimal',
  claudeOpus47Effort: 'low',
  qwen3CoderThinkingEnabled: false,
} as const;

const values = {
  outputMode: 'json',
  temperature: 0.2,
  maxTokens: 4096,
  reasoningPolicy,
} as const;

export const createModelReasoningKwargs = (model: string): Record<string, unknown> => {
  const normalized = model.toLowerCase();
  if (normalized.startsWith('gpt-5')) {
    return {reasoning_effort: reasoningPolicy.gpt5ReasoningEffort};
  }
  if (normalized.startsWith('gemini-3.5-flash')) {
    return {reasoning_effort: reasoningPolicy.gemini35FlashThinkingLevel};
  }
  if (normalized.startsWith('claude-opus-4-7') || normalized.startsWith('claude-opus-4.7')) {
    return {reasoning_effort: reasoningPolicy.claudeOpus47Effort};
  }
  if (normalized.startsWith('qwen3-coder')) {
    return {enable_thinking: reasoningPolicy.qwen3CoderThinkingEnabled};
  }
  return {};
};

export const createOCLGenerationConfiguration = () => ({
  version: OCL_GENERATION_CONFIG_VERSION,
  ...values,
  hash: createHash('sha256').update(JSON.stringify(values), 'utf8').digest('hex'),
});

export type OCLGenerationConfiguration = ReturnType<typeof createOCLGenerationConfiguration>;
