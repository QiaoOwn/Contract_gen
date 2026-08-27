import {models} from '@/app/constant';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import * as allProjects from '@/rm2pt/project';
import {generateOCL, GenerateOCLParam} from '@/app/service/generateOCL';
import {UseCaseKeys} from '@/app/type';
type Checkpoint = Record<
  string,
  Record<string, Record<string, Record<string, {pass?: boolean} & {time: number}>>>
>;
const {parsed} = dotenv.config();
const OPENAI_API_KEY = parsed!.OPENAI_API_KEY;
const folderPath = path.resolve(process.cwd(), 'experiment-line');
fs.ensureDirSync(folderPath);
const checkpoint: Checkpoint = fs.readJSONSync(path.resolve(folderPath, 'checkpoint.json'));
const writeCheckpoint = (checkpoint: Checkpoint) =>
  fs.writeJSONSync(path.resolve(folderPath, 'checkpoint.json'), checkpoint, {spaces: 2});
const experiment = async ({project, useCase, operation, model, apiKey}: GenerateOCLParam) => {
  console.log(`Start generating OCL for ${project} ${useCase} ${operation} with model ${model}`);
  const stream = await generateOCL({
    project,
    useCase,
    operation,
    model,
    apiKey,
    graphMode: 'linear',
    feedbackMode: 'none',
    maxGenerationAttempts: 1,
  });
  try {
    const dateTime = new Date().getTime();
    const filePath = path.resolve(
      folderPath,
      `${model}-${project}-${useCase}-${operation}-${dateTime}.json`
    );
    const processes = [];
    for await (const value of stream) {
      console.log('---STEP---');
      console.log(value);
      processes.push(value);
      fs.ensureFileSync(filePath);
      fs.writeJSONSync(filePath, processes, {spaces: 2});
      console.log('---END STEP---', dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }
    const lastStep = processes.at(-1)!['Test Result'];
    if (lastStep) {
      if (lastStep.result?.numPassingTests) {
        checkpoint[model][project][useCase][operation].pass = true;
        writeCheckpoint(checkpoint);
        return;
      } else {
        throw new Error('retry');
      }
    } else {
      throw new Error('retry');
    }
  } catch (error) {
    console.error(error);
    checkpoint[model][project][useCase][operation].time = 5;
    writeCheckpoint(checkpoint);
  }
};
(async () => {
  for (const model of models) {
    if (!checkpoint[model]) {
      checkpoint[model] = {};
      writeCheckpoint(checkpoint);
    }
    for (const [p, {useCase}] of Object.entries(allProjects)) {
      const project = p as keyof typeof allProjects;
      if (!checkpoint[model][project]) {
        checkpoint[model][project] = {};
        writeCheckpoint(checkpoint);
      }
      for (const [
        uc,
        {
          relatedService: {operations},
        },
      ] of Object.entries(useCase)) {
        const useCase = uc as UseCaseKeys;
        if (!checkpoint[model][project][useCase]) {
          checkpoint[model][project][useCase] = {};
          writeCheckpoint(checkpoint);
        }
        for (const {name: operation} of operations) {
          if (!checkpoint[model][project][useCase][operation]) {
            checkpoint[model][project][useCase][operation] = {time: 1};
            writeCheckpoint(checkpoint);
          } else {
            if (
              checkpoint[model][project][useCase][operation].pass ||
              checkpoint[model][project][useCase][operation].time >= 5
            ) {
              console.log(
                `Skip ${model} ${project} ${useCase} ${operation}, pass: ${checkpoint[model][project][useCase][operation].pass}, time: ${checkpoint[model][project][useCase][operation].time}`
              );
              continue;
            }
          }
          await experiment({
            project,
            useCase,
            operation,
            model,
            apiKey: OPENAI_API_KEY,
          });
        }
      }
    }
  }
})();
