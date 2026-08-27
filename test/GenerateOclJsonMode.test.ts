import {HumanMessage} from '@langchain/core/messages';
import {ChatOpenAI} from '@langchain/openai';
import {z} from 'zod';
import {generateOclWithJsonMode} from '../src/app/service/generateOclWithJsonMode';

const mockInvoke = jest.fn();

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: mockInvoke,
  })),
}));

const schema = z.object({
  definition: z.string().nullable(),
  precondition: z.string(),
  postcondition: z.string(),
});

const param = {
  model: 'gpt-5.5',
  apiKey: 'test-key',
  baseURL: 'https://example.test/v1',
  messages: [new HumanMessage('Return the OCL fields as JSON.')],
  schema,
};

describe('generateOclWithJsonMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockReset();
  });

  it('requests JSON object response mode and validates the three OCL fields', async () => {
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        definition: null,
        precondition: 'true',
        postcondition: 'result = true',
      }),
      response_metadata: {finish_reason: 'stop'},
      usage_metadata: {output_tokens: 20},
    });

    await expect(generateOclWithJsonMode(param)).resolves.toEqual({
      definition: '',
      precondition: 'true',
      postcondition: 'result = true',
    });
    expect(mockInvoke).toHaveBeenCalledWith(param.messages, {
      response_format: {type: 'json_object'},
    });
    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        modelKwargs: {reasoning_effort: 'none'},
        maxTokens: 4096,
      })
    );
  });

  it('reports completion diagnostics when the provider returns no JSON object', async () => {
    mockInvoke.mockResolvedValue({
      content: '',
      response_metadata: {finish_reason: 'length'},
      usage_metadata: {
        output_tokens: 4096,
        output_token_details: {reasoning: 4096},
      },
    });

    await expect(generateOclWithJsonMode(param)).rejects.toThrow(
      'finish_reason=length, output_tokens=4096, reasoning_tokens=4096'
    );
  });

  it.each([
    ['gemini-3.5-flash', {reasoning_effort: 'minimal'}],
    ['claude-opus-4-7', {reasoning_effort: 'low'}],
    ['qwen3-coder-plus', {enable_thinking: false}],
  ])('uses the frozen reasoning policy for %s', async (model, modelKwargs) => {
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        definition: null,
        precondition: 'true',
        postcondition: 'result = true',
      }),
      response_metadata: {finish_reason: 'stop'},
      usage_metadata: {output_tokens: 20},
    });

    await generateOclWithJsonMode({...param, model: model as typeof param.model});

    expect(ChatOpenAI).toHaveBeenLastCalledWith(expect.objectContaining({model, modelKwargs}));
  });
});
