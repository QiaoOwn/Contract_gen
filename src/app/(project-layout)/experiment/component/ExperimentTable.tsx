'use client';
import {
  generateAblationStudyExperimentResult,
  generateExperimentResult,
} from '@/app/service/generateExperimentResult';
import {Divider, Space, Table, Tag} from 'antd';
import {FC} from 'react';
export type ExperimentTableProps = {
  result: ReturnType<typeof generateExperimentResult>;
  ablationResult: ReturnType<typeof generateAblationStudyExperimentResult>;
};
const ExperimentTable: FC<ExperimentTableProps> = ({result, ablationResult}) => {
  const modelsAggregated = result.aggregated;
  const models = Object.keys(modelsAggregated);
  const ablationModelsAggregated = ablationResult.aggregated;
  const ablationModels = Object.keys(ablationModelsAggregated);
  let maxRougeL = 0;
  let maxBleu = 0;
  let maxCosineSimilarity = 0;
  let maxOCLGenerator = 0;
  let maxContractGenerator = 0;
  let maxTypescriptGenerator = 0;
  let maxTypescriptParser = 0;
  let maxTestResult = 0;
  let maxValidity = 0;
  let maxCorrectness = 0;

  let maxAblationOCLGenerator = 0;
  let maxAblationContractGenerator = 0;
  let maxAblationTypescriptGenerator = 0;
  let maxAblationTypescriptParser = 0;
  let maxAblationTestResult = 0;
  let maxAblationValidity = 0;
  let maxAblationCorrectness = 0;

  let minRougeL = Infinity;
  let minBleu = Infinity;
  let minCosineSimilarity = Infinity;

  let minOCLGenerator = Infinity;
  let minContractGenerator = Infinity;
  let minTypescriptGenerator = Infinity;
  let minTypescriptParser = Infinity;
  let minTestResult = Infinity;
  let minValidity = Infinity;
  let minCorrectness = Infinity;

  let minAblationOCLGenerator = Infinity;
  let minAblationContractGenerator = Infinity;
  let minAblationTypescriptGenerator = Infinity;
  let minAblationTypescriptParser = Infinity;
  let minAblationTestResult = Infinity;
  let minAblationValidity = Infinity;
  let minAblationCorrectness = Infinity;
  type DataSourceRow = {
    metric: string;
    key: string;
    [model: string]: string | number;
  };

  const dataSource: DataSourceRow[] = [
    {
      metric: 'RougeL',
      key: 'rougeL',
      ...models.reduce((acc, model) => {
        const rougeL = modelsAggregated[model]?.rougeL || 0;
        maxRougeL = Math.max(rougeL, maxRougeL);
        if (rougeL !== 0) {
          minRougeL = Math.min(rougeL, minRougeL);
        }
        return {...acc, [model]: rougeL};
      }, {}),
    },
    {
      metric: 'Bleu',
      key: 'bleu',
      ...models.reduce((acc, model) => {
        const bleu = modelsAggregated[model]?.bleu || 0;
        maxBleu = Math.max(bleu, maxBleu);
        if (bleu !== 0) {
          minBleu = Math.min(bleu, minBleu);
        }
        return {...acc, [model]: bleu};
      }, {}),
    },
    {
      metric: 'Cosine Similarity',
      key: 'cosineSimilarity',
      ...models.reduce((acc, model) => {
        const cosineSimilarity = modelsAggregated[model]?.cosineSimilarity || 0;
        maxCosineSimilarity = Math.max(cosineSimilarity, maxCosineSimilarity);
        if (cosineSimilarity !== 0) {
          minCosineSimilarity = Math.min(cosineSimilarity, minCosineSimilarity);
        }
        return {...acc, [model]: cosineSimilarity};
      }, {}),
    },
    {
      metric: 'OCL Generated',
      key: 'OCL Generator',
      ...models.reduce((acc, model) => {
        const oclGenerator = modelsAggregated[model]?.['OCL Generator'] || 0;
        maxOCLGenerator = Math.max(oclGenerator, maxOCLGenerator);
        if (oclGenerator !== 0) {
          minOCLGenerator = Math.min(oclGenerator, minOCLGenerator);
        }
        return {...acc, [model]: oclGenerator};
      }, {}),
    },
    {
      metric: 'Contract Generated',
      key: 'Contract Generator',
      ...models.reduce((acc, model) => {
        const contractGenerator = modelsAggregated[model]?.['Contract Generator'] || 0;
        maxContractGenerator = Math.max(contractGenerator, maxContractGenerator);
        if (contractGenerator !== 0) {
          minContractGenerator = Math.min(contractGenerator, minContractGenerator);
        }
        return {...acc, [model]: contractGenerator};
      }, {}),
    },
    {
      metric: 'TypeScript Generated',
      key: 'TypeScript Generator',
      ...models.reduce((acc, model) => {
        const typescriptGenerator = modelsAggregated[model]?.['TypeScript Generator'] || 0;
        maxTypescriptGenerator = Math.max(typescriptGenerator, maxTypescriptGenerator);
        if (typescriptGenerator !== 0) {
          minTypescriptGenerator = Math.min(typescriptGenerator, minTypescriptGenerator);
        }
        return {...acc, [model]: typescriptGenerator};
      }, {}),
    },
    {
      metric: 'TypeScript Parsed',
      key: 'TypeScript Parser',
      ...models.reduce((acc, model) => {
        const typescriptParser = modelsAggregated[model]?.['TypeScript Parser'] || 0;
        maxTypescriptParser = Math.max(typescriptParser, maxTypescriptParser);
        if (typescriptParser !== 0) {
          minTypescriptParser = Math.min(typescriptParser, minTypescriptParser);
        }
        return {...acc, [model]: typescriptParser};
      }, {}),
    },
    {
      metric: 'Pass Test Result',
      key: 'Test Result',
      ...models.reduce((acc, model) => {
        const testResult = modelsAggregated[model]?.['Test Result'] || 0;
        maxTestResult = Math.max(testResult, maxTestResult);
        if (testResult !== 0) {
          minTestResult = Math.min(testResult, minTestResult);
        }
        return {...acc, [model]: testResult};
      }, {}),
    },
    {
      metric: 'Validity',
      key: 'validity',
      ...models.reduce((acc, model) => {
        const validity = modelsAggregated[model]?.validity || 0;
        maxValidity = Math.max(validity, maxValidity);
        if (validity !== 0) {
          minValidity = Math.min(validity, minValidity);
        }
        return {...acc, [model]: validity};
      }, {}),
    },
    {
      metric: 'Correctness',
      key: 'correctness',
      ...models.reduce((acc, model) => {
        const correctness = modelsAggregated[model]?.correctness || 0;
        maxCorrectness = Math.max(correctness, maxCorrectness);
        if (correctness !== 0) {
          minCorrectness = Math.min(correctness, minCorrectness);
        }
        return {...acc, [model]: correctness};
      }, {}),
    },
  ];
  const ablationDataSource: DataSourceRow[] = [
    {
      metric: 'OCL Generated',
      key: 'OCL Generator',
      ...ablationModels.reduce((acc, model) => {
        const oclGenerator = ablationModelsAggregated[model]?.['OCL Generator'] || 0;
        maxAblationOCLGenerator = Math.max(oclGenerator, maxAblationOCLGenerator);
        if (oclGenerator !== 0) {
          minAblationOCLGenerator = Math.min(oclGenerator, minAblationOCLGenerator);
        }
        return {...acc, [model]: oclGenerator};
      }, {}),
    },
    {
      metric: 'Contract Generated',
      key: 'Contract Generator',
      ...ablationModels.reduce((acc, model) => {
        const contractGenerator = ablationModelsAggregated[model]?.['Contract Generator'] || 0;
        maxAblationContractGenerator = Math.max(contractGenerator, maxAblationContractGenerator);
        if (contractGenerator !== 0) {
          minAblationContractGenerator = Math.min(contractGenerator, minAblationContractGenerator);
        }
        return {...acc, [model]: contractGenerator};
      }, {}),
    },
    {
      metric: 'TypeScript Generated',
      key: 'TypeScript Generator',
      ...ablationModels.reduce((acc, model) => {
        const typescriptGenerator = ablationModelsAggregated[model]?.['TypeScript Generator'] || 0;
        maxAblationTypescriptGenerator = Math.max(
          typescriptGenerator,
          maxAblationTypescriptGenerator
        );
        if (typescriptGenerator !== 0) {
          minAblationTypescriptGenerator = Math.min(
            typescriptGenerator,
            minAblationTypescriptGenerator
          );
        }
        return {...acc, [model]: typescriptGenerator};
      }, {}),
    },
    {
      metric: 'TypeScript Parsed',
      key: 'TypeScript Parser',
      ...ablationModels.reduce((acc, model) => {
        const typescriptParser = ablationModelsAggregated[model]?.['TypeScript Parser'] || 0;
        maxAblationTypescriptParser = Math.max(typescriptParser, maxAblationTypescriptParser);
        if (typescriptParser !== 0) {
          minAblationTypescriptParser = Math.min(typescriptParser, minAblationTypescriptParser);
        }
        return {...acc, [model]: typescriptParser};
      }, {}),
    },
    {
      metric: 'Pass Test Result',
      key: 'Test Result',
      ...ablationModels.reduce((acc, model) => {
        const testResult = ablationModelsAggregated[model]?.['Test Result'] || 0;
        maxAblationTestResult = Math.max(testResult, maxAblationTestResult);
        if (testResult !== 0) {
          minAblationTestResult = Math.min(testResult, minAblationTestResult);
        }
        return {...acc, [model]: testResult};
      }, {}),
    },
    {
      metric: 'Validity',
      key: 'validity',
      ...ablationModels.reduce((acc, model) => {
        const validity = ablationModelsAggregated[model]?.validity || 0;
        maxAblationValidity = Math.max(validity, maxAblationValidity);
        if (validity !== 0) {
          minAblationValidity = Math.min(validity, minAblationValidity);
        }
        return {...acc, [model]: validity};
      }, {}),
    },
    {
      metric: 'Correctness',
      key: 'correctness',
      ...ablationModels.reduce((acc, model) => {
        const correctness = ablationModelsAggregated[model]?.correctness || 0;
        maxAblationCorrectness = Math.max(correctness, maxAblationCorrectness);
        if (correctness !== 0) {
          minAblationCorrectness = Math.min(correctness, minAblationCorrectness);
        }
        return {...acc, [model]: correctness};
      }, {}),
    },
  ];
  const max = [
    maxRougeL,
    maxBleu,
    maxCosineSimilarity,
    maxOCLGenerator,
    maxContractGenerator,
    maxTypescriptGenerator,
    maxTypescriptParser,
    maxTestResult,
    maxValidity,
    maxCorrectness,
  ];
  const ablationMax = [
    maxAblationOCLGenerator,
    maxAblationContractGenerator,
    maxAblationTypescriptGenerator,
    maxAblationTypescriptParser,
    maxAblationTestResult,
    maxAblationValidity,
    maxAblationCorrectness,
  ];
  const min = [
    minRougeL,
    minBleu,
    minCosineSimilarity,
    minOCLGenerator,
    minContractGenerator,
    minTypescriptGenerator,
    minTypescriptParser,
    minTestResult,
    minValidity,
    minCorrectness,
  ];
  const ablationMin = [
    minAblationOCLGenerator,
    minAblationContractGenerator,
    minAblationTypescriptGenerator,
    minAblationTypescriptParser,
    minAblationTestResult,
    minAblationValidity,
    minAblationCorrectness,
  ];
  const filteredModels = models.filter(
    (m) => m === 'DeepOCL' || m === 'PathOCL' || m === 'Codex Prompt'
  );
  const langChainOCLModels = models.filter(
    (m) => m !== 'DeepOCL' && m !== 'PathOCL' && m !== 'Codex Prompt'
  );
  return (
    <>
      <Table
        pagination={false}
        bordered
        dataSource={dataSource}
        columns={[
          {title: 'Metric / Model', dataIndex: 'metric', key: 'metric'},
          ...filteredModels.map((model) => ({
            title: model,
            dataIndex: model,
            key: model,
            render(_: {key: string}, __: {key: string}, index: number) {
              const maxColor = dataSource[index]?.[model] === max[index] ? 'red' : undefined;
              const minColor = dataSource[index]?.[model] === min[index] ? 'green' : undefined;
              const value = dataSource[index]?.[model];
              return <span style={{color: maxColor || minColor}}>{value === 0 ? '/' : value}</span>;
            },
          })),
          {
            title: 'LangChain OCL Models',
            children: langChainOCLModels.map((model) => ({
              title: model,
              dataIndex: model,
              key: model,
              render(_: {key: string}, __: {key: string}, index: number) {
                const maxColor = dataSource[index]?.[model] === max[index] ? 'red' : undefined;
                const minColor = dataSource[index]?.[model] === min[index] ? 'green' : undefined;
                const value = dataSource[index]?.[model];
                return (
                  <span style={{color: maxColor || minColor}}>{value === 0 ? '/' : value}</span>
                );
              },
            })),
          },
        ]}
      />
      <Divider>Ablation Study Results</Divider>
      <Table
        pagination={false}
        bordered
        dataSource={ablationDataSource}
        columns={[
          {title: 'Metric / Model', dataIndex: 'metric', key: 'metric'},
          ...filteredModels.map((model) => ({
            title: model,
            dataIndex: model,
            key: model,
            render(_: {key: string}, __: {key: string}, index: number) {
              const maxColor =
                ablationDataSource[index]?.[model] === ablationMax[index] ? 'red' : undefined;
              const minColor =
                ablationDataSource[index]?.[model] === ablationMin[index] ? 'green' : undefined;
              const value = ablationDataSource[index]?.[model];
              return <span style={{color: maxColor || minColor}}>{value === 0 ? '/' : value}</span>;
            },
          })),
          {
            title: 'LangChain OCL Models',
            children: langChainOCLModels.map((model) => ({
              title: model,
              dataIndex: model,
              key: model,
              render(_: {key: string}, __: {key: string}, index: number) {
                const maxColor =
                  ablationDataSource[index]?.[model] === ablationMax[index] ? 'red' : undefined;
                const minColor =
                  ablationDataSource[index]?.[model] === ablationMin[index] ? 'green' : undefined;
                const value = ablationDataSource[index]?.[model];
                return (
                  <span style={{color: maxColor || minColor}}>{value === 0 ? '/' : value}</span>
                );
              },
            })),
          },
        ]}
      />
      <Space>
        <Tag color="red">Max</Tag>
        <Tag color="green">Min</Tag>
      </Space>
    </>
  );
};
export default ExperimentTable;
