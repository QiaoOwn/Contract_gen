import {ChatOpenAI} from '@langchain/openai';
import {defaultModel} from '@/app/constant';

const openAIBaseURL = process.env.OPENAI_BASE_URL || 'https://api.apiyi.com/v1';
export const checkApiKey = async (apiKey: string) => {
  const model = new ChatOpenAI({
    apiKey,
    model: defaultModel,
    temperature: 0,
    configuration: {
      baseURL: openAIBaseURL,
    },
  });
  const response = await model.invoke('Hello world!');
  return response;
};
