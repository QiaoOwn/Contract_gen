import {UseCase} from '@/rm2pt/model/UseCase';
import * as typescript from 'typescript';
import * as jestRunner from 'jest';
import * as project from '@/rm2pt/project';
import * as babel from '@babel/core';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import type {CoverageSummary} from 'istanbul-lib-coverage';
import type {TestResult} from '@jest/test-result';
import {OpenAIChatModelId} from '@langchain/openai';
import {SystemMessage} from '@langchain/core/messages';
import {whatIsDefinition, whatIsPrecondition, whatIsPostcondition} from '../constant';
import {Annotation, MessagesAnnotation, StateGraph} from '@langchain/langgraph';
import {z} from 'zod';
import {formatContract, generateContractCode, parse} from '../util';
import {createGlobalEntryCode, createIsolatedTestRuntime} from './createGlobalEntryCode';
import {buildEntryCode, createEntryCode} from './createEntryCode';
import path from 'path';
import fs from 'fs-extra';
import {randomUUID} from 'crypto';
import generate from '@babel/generator';
import {GenerateOCLParam} from './generateOCL';
import {generateOclWithJsonModeDetailed, OclGenerationUsage} from './generateOclWithJsonMode';
import {createOCLGenerationSystemPrompt} from './createOCLGenerationSystemPrompt';
import {summarizeJestResults} from './summarizeJestResults';
import {OperationInputMetadata} from './createOperationInput';
import {validateGeneratedContractSemantics} from './validateGeneratedContractSemantics';
import {createOperationModelGrounding, type OperationModelGrounding} from './operationModelGrounding';
import {validateModelGroundedContract, type ModelRuleValidationResult} from './validateModelGroundedContract';
import {boundaryOraclePath, historicalOraclePath, writeCandidateBoundaryOracle} from './labAdjudicatedOracle';
const openAIBaseURL = process.env.OPENAI_BASE_URL || 'https://api.apiyi.com/v1';
const contractSchema = z.object({
  definition: z.string().nullable().describe(whatIsDefinition),
  precondition: z.string().describe(whatIsPrecondition),
  postcondition: z.string().describe(whatIsPostcondition),
});
type E = {
  line: number;
  column: number;
  msg: string;
};

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  model: Annotation<OpenAIChatModelId>,
  project: Annotation<GenerateOCLParam['project']>,
  useCase: Annotation<GenerateOCLParam['useCase']>,
  apiKey: Annotation<GenerateOCLParam['apiKey']>,
  operation: Annotation<GenerateOCLParam['operation']>,
  userInput: Annotation<GenerateOCLParam['userInput']>,
  oracleProfile: Annotation<GenerateOCLParam['oracleProfile']>,
  feedbackUsed: Annotation<boolean>,
  maxGenerationAttempts: Annotation<GenerateOCLParam['maxGenerationAttempts']>,
  generationCount: Annotation<number>,
  generationUsage: Annotation<OclGenerationUsage>,
  inputMetadata: Annotation<OperationInputMetadata>,
  modelGroundingContext: Annotation<OperationModelGrounding>,
  modelRuleValidation: Annotation<ModelRuleValidationResult | null>,
  contractSyntaxValid: Annotation<boolean>,
  promptMetadata: Annotation<{
    version: string;
    hash: string;
    generationConfigVersion: string;
    generationConfigHash: string;
    generationGrammarVersion: string;
    generationGrammarHash: string;
    generationRulesVersion: string;
    generationRulesHash: string;
    outputMode: string;
    temperature: number;
    maxTokens: number;
  }>,
  ocl: Annotation<{
    definition: string;
    precondition: string;
    postcondition: string;
  }>,
  contract: Annotation<string>,
  typescript: Annotation<Awaited<ReturnType<typeof createEntryCode>>>,
  result: Annotation<TestResult>,
  summary: Annotation<CoverageSummary>,
  contractErrors: Annotation<E[]>,
  typescriptErrors: Annotation<E[]>,
});
const oclGeneratorNode = async (state: typeof StateAnnotation.State) => {
  const {apiKey, messages} = state;
  const systemPrompt = createOCLGenerationSystemPrompt();
  const newMessages = [new SystemMessage(systemPrompt.text), ...messages];

  const generation = await generateOclWithJsonModeDetailed({
    model: state.model,
    apiKey,
    baseURL: openAIBaseURL,
    messages: newMessages,
    schema: contractSchema,
  });
  return {
    ocl: generation.ocl,
    generationUsage: generation.usage,
    contractErrors: [],
    typescriptErrors: [],
    modelRuleValidation: null,
    model: state.model,
    userInput: state.userInput,
    feedbackUsed: false,
    generationCount: (state.generationCount || 0) + 1,
    inputMetadata: state.inputMetadata,
    promptMetadata: {
      version: systemPrompt.version,
      hash: systemPrompt.hash,
      generationConfigVersion: systemPrompt.generationConfig.version,
      generationConfigHash: systemPrompt.generationConfig.hash,
      generationGrammarVersion: systemPrompt.components.grammar.version,
      generationGrammarHash: systemPrompt.components.grammar.hash,
      generationRulesVersion: systemPrompt.components.generationRules.version,
      generationRulesHash: systemPrompt.components.generationRules.hash,
      outputMode: systemPrompt.generationConfig.outputMode,
      temperature: systemPrompt.generationConfig.temperature,
      maxTokens: systemPrompt.generationConfig.maxTokens,
    },
  };
};

const contractGeneratorNode = async (state: typeof StateAnnotation.State) => {
  const {project: key, useCase: uc, operation: op, ocl} = state;
  const p = project[key];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const contract = generateContractCode({
    serviceName: service.name,
    operationName: operation.name,
    parameters: operation.parameters,
    returnedType: operation.returnType?.type,
    ...ocl,
  });
  const {errors: parserErrors, tree, tokens} = parse(contract);
  const semanticErrors =
    parserErrors.length === 0 && tree
      ? validateGeneratedContractSemantics({
          tree,
          hasReturnValue: Boolean(operation.returnType?.type),
        })
      : [];
  const modelRuleValidation = parserErrors.length === 0 && tree
    ? validateModelGroundedContract({tree, context: state.modelGroundingContext || createOperationModelGrounding(state)})
    : null;
  const contractErrors = [...parserErrors, ...semanticErrors, ...(modelRuleValidation?.diagnostics || [])];
  return {
    modelRuleValidation,
    contractSyntaxValid: parserErrors.length === 0 && semanticErrors.length === 0,
    contractErrors,
    contract: contractErrors.length === 0 && tree ? formatContract(tree, tokens) : contract,
  };
};

const typescriptGeneratorNode = async (state: typeof StateAnnotation.State) => {
  try {
    const typescript = await createEntryCode(state);
    return {
      typescript,
      typescriptErrors: [],
    };
  } catch (error) {
    return {
      typescriptErrors: [
        {
          line: 0,
          column: 0,
          msg: (error as Error).message,
        },
      ],
    };
  }
};

const typescriptParserNode = async (state: typeof StateAnnotation.State) => {
  const {typescript: tsCode} = state;
  const prefix = `langchain_ocl/${new Date().getTime()}`;
  const entryFileName: string = `/${prefix}/entry/index.ts`;
  const globalEntryFileName: string = `/${prefix}/globalEntry.ts`;
  const dayjsFileName = `/${prefix}/dayjs.ts`;
  const compilerOptions: typescript.CompilerOptions = {
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    strict: true,
    noEmitOnError: false,
    lib: ['esnext'],
    allowJs: true,
    skipLibCheck: true,
    strictNullChecks: false,
    noEmit: true,
    esModuleInterop: true,
    moduleResolution: typescript.ModuleResolutionKind.Bundler,
    resolveJsonModule: true,
    isolatedModules: true,
    noImplicitAny: false,
    incremental: true,
    typeRoots: [path.join(process.cwd(), 'node_modules', '@types')],
    types: ['node'],
    paths: {
      dayjs: [dayjsFileName],
    },
  };

  const fileMap = {
    [entryFileName]: tsCode.entry,
    [globalEntryFileName]: createGlobalEntryCode(),
    [dayjsFileName]: fs.readFileSync(`${process.cwd()}/node_modules/dayjs/index.d.ts`, 'utf-8'),
  };
  const fileNames = Object.keys(fileMap);
  const languageService = typescript.createLanguageService(
    {
      getScriptFileNames: () => fileNames,
      getScriptVersion: () => '1',
      getScriptSnapshot: (name) => {
        if (name in fileMap) {
          return typescript.ScriptSnapshot.fromString(fileMap[name]);
        }
        if (fs.existsSync(name)) {
          return typescript.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf-8'));
        }
        return undefined;
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: (options) => {
        const fileName = typescript.getDefaultLibFilePath(options);
        return fileName;
      },
      fileExists: (fileName) => fileMap[fileName] !== undefined || fs.existsSync(fileName),
      readFile: (fileName) => {
        if (fileMap[fileName]) {
          return fileMap[fileName];
        }
        try {
          const file = fs.readFileSync(fileName, 'utf-8');
          return file;
        } catch {
          return undefined;
        }
      },
      readDirectory: (path, extensions) => extensions?.map((ext) => `${path}/file${ext}`) || [],
      directoryExists: () => true,
      getDirectories: () => [],
    },
    typescript.createDocumentRegistry()
  );

  const syntaxDiagnostics = languageService.getSyntacticDiagnostics(entryFileName);
  const semanticDiagnostics = languageService.getSemanticDiagnostics(entryFileName);
  const diagnostics = [...syntaxDiagnostics, ...semanticDiagnostics];

  const errors = diagnostics.map((diagnostic) => {
    if (diagnostic.file) {
      const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      return {
        line: line + 1,
        column: character + 1,
        msg: message,
        code: diagnostic.code,
      };
    }
    return {
      message: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      code: diagnostic.code,
    };
  });
  if (errors.length) {
    return {
      typescriptErrors: errors,
    };
  } else {
    return {
      typescript: state.typescript,
      contract: state.contract,
      typescriptErrors: [],
    };
  }
};

const testResultNode = async (state: typeof StateAnnotation.State) => {
  const {project: key, useCase: uc, operation: op} = state;
  const p = project[key];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const serviceName = service.name;
  const operationName = operation.name;
  const testDir = path.resolve(process.cwd(), 'test');
  const folder = path.resolve(testDir, 'tmp');
  fs.ensureDirSync(folder);
  const fileName = `${key}${serviceName}${operationName}${randomUUID().replaceAll('-', '')}`;
  const testFileName = `${fileName}.test.ts`;
  const testFilePath = path.resolve(folder, testFileName);
  const filePath = path.resolve(folder, `${fileName}.ts`);
  const originTestFilePath = historicalOraclePath(
    state.oracleProfile,
    key,
    uc,
    op,
    path.resolve(testDir, `${key}-${serviceName}-${operationName}/index.test.ts`)
  );
  const originTestFileAst = babel.parse(fs.readFileSync(originTestFilePath, 'utf-8'), {
    filename: 'test.ts',
    presets: [presetTypescript],
  })!;
  babel.traverse(originTestFileAst, {
    enter(path) {
      if (path.isStringLiteral({value: './entry'})) {
        path.node.value = `./${fileName}`;
      }
      if (path.isIdentifier({name: serviceName})) {
        path.node.name = `${serviceName}_AutoGenerated`;
      }
    },
  });
  fs.writeFileSync(testFilePath, generate(originTestFileAst).code, 'utf-8');
  const boundarySource = boundaryOraclePath(state.oracleProfile, key, uc, op);
  const boundaryTestFileName = `${fileName}.boundary.test.ts`;
  const boundaryTestFilePath = path.resolve(folder, boundaryTestFileName);
  if (boundarySource) {
    writeCandidateBoundaryOracle({
      source: boundarySource,
      output: boundaryTestFilePath,
      candidateModule: `./${fileName}`,
      serviceName,
    });
  }
  const runtime = await createIsolatedTestRuntime();
  try {
    fs.writeFileSync(filePath, buildEntryCode({service: state.typescript!.originalService,
      entity: state.typescript!.originalEntity, runtimeModule: `./${path.basename(runtime.path, '.ts')}`}));
    const res = await jestRunner.runCLI(
      {
        _: [
          `test/tmp/${testFileName}`,
          ...(boundarySource ? [`test/tmp/${boundaryTestFileName}`] : []),
        ],
        $0: '',
        json: true,
        coverage: true,
        runTestsByPath: true,
        config: runtime.config,
      },
      [process.cwd()]
    );
    const summary = res.results.coverageMap!.getCoverageSummary();
    const tests = res.results.testResults;
    if (tests.length !== (boundarySource ? 2 : 1)) {
      throw new Error(`Expected ${boundarySource ? 2 : 1} oracle suite(s), received ${tests.length}`);
    }
    const result = summarizeJestResults(res.results, boundarySource ? 2 : 1);
    return {
      typescript: state.typescript,
      contract: state.contract,
      summary,
      result,
    };
  } finally {
    runtime.dispose();
    fs.removeSync(testFilePath);
    if (boundarySource) fs.removeSync(boundaryTestFilePath);
    fs.removeSync(filePath);
  }
};

const builder = new StateGraph(StateAnnotation)
  .addNode('OCL Generator', oclGeneratorNode)
  .addNode('Contract Generator', contractGeneratorNode)
  .addNode('TypeScript Generator', typescriptGeneratorNode)
  .addNode('TypeScript Parser', typescriptParserNode)
  .addNode('Test Result', testResultNode)
  .addEdge('__start__', 'OCL Generator')
  .addEdge('OCL Generator', 'Contract Generator')
  .addConditionalEdges(
    'Contract Generator',
    (state: typeof StateAnnotation.State) =>
      state.contractErrors?.length > 0 ? 'invalid' : 'next',
    {next: 'TypeScript Generator', invalid: '__end__'}
  )
  .addConditionalEdges(
    'TypeScript Generator',
    (state: typeof StateAnnotation.State) =>
      state.typescriptErrors?.length > 0 ? 'invalid' : 'next',
    {next: 'TypeScript Parser', invalid: '__end__'}
  )
  .addConditionalEdges(
    'TypeScript Parser',
    (state: typeof StateAnnotation.State) =>
      state.typescriptErrors?.length > 0 ? 'invalid' : 'next',
    {next: 'Test Result', invalid: '__end__'}
  )
  .addEdge('Test Result', '__end__');

export const graph = builder.compile();
