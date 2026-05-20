import fs from 'fs-extra';
import path from 'path';
import {OpenAIChatModelId} from '@langchain/openai';
import dotenv from 'dotenv';
import {OpenAI} from 'openai';
const {parsed} = dotenv.config();
const OPENAI_API_KEY = parsed!.OPENAI_API_KEY;
const OPENAI_BASE_URL = parsed!.OPENAI_BASE_URL || 'https://api.apiyi.com/v1';
const openai = new OpenAI({apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL});
function calculateCosineSimilarity(A: number[], B: number[]) {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < A.length; i++) {
    dot += A[i] * B[i];
    magA += A[i] ** 2;
    magB += B[i] ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
type Result = {
  [model: string]: {
    ocl: string;
    candidate: string;
    cosineSimilarity: number;
  }[];
};
export const generateCosineSimilarity = async () => {
  const bleuDataSetPath = path.resolve(process.cwd(), 'bleu-dataset');
  const result: Result = {};
  await Promise.all(
    fs.readdirSync(bleuDataSetPath).map(async (file) => {
      const model = file.split('.json')[0] as OpenAIChatModelId;
      result[model] = [];
      result[model] = await Promise.all(
        fs
          .readJSONSync(path.join(bleuDataSetPath, file))
          .map(async (item: {ocl: string; candidate: string}) => {
            const ocl = item.ocl;
            const candidate = item.candidate;
            const emb1 = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: ocl,
            });
            const emb2 = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: candidate,
            });
            const cosineSimilarity = calculateCosineSimilarity(
              emb1.data[0].embedding,
              emb2.data[0].embedding
            );
            console.log(ocl);
            console.log(candidate);
            console.log(`Cosine similarity - ${cosineSimilarity}`);
            return {...item, cosineSimilarity};
          })
      );
      const filePath = path.join(path.resolve(process.cwd(), 'cosine-similarity'), `${model}.json`);
      fs.ensureFileSync(filePath);
      fs.writeJSONSync(filePath, result[model], {spaces: 2});
      console.log(`Cosine similarity for model ${model} generated.`);
      return result[model];
    })
  );
};
(async () => {
  await generateCosineSimilarity();
})();
