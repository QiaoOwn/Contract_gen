import {UseCase} from '@/rm2pt/model/UseCase';
import * as typescript from 'typescript';
import * as jest from 'jest';
import * as project from '@/rm2pt/project';
import * as babel from '@babel/core';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import type {CoverageSummary} from 'istanbul-lib-coverage';
import type {TestResult} from '@jest/test-result';
import {OpenAIChatModelId} from '@langchain/openai';
import {AIMessage, HumanMessage, SystemMessage} from '@langchain/core/messages';
import {whatIsDefination, whatIsPrecondition, whatIsPostcondition} from '../constant';
import {createProjectContextPrompt} from './createProjectContextPrompt';
import {Annotation, MessagesAnnotation, StateGraph} from '@langchain/langgraph';
import {z} from 'zod';
import {createG4Prompt} from './createG4Prompt';
import {createDefinitionPrompt} from './createDefinitionPrompt';
import {createTransformRulesPrompt} from './createTransformRulesPrompt';
import {formatContract, generateContractCode, parse} from '../util';
import {createGlobalEntryCode} from './createGlobalEntryCode';
import {buildEntryCode, createEntryCode} from './createEntryCode';
import path from 'path';
import fs from 'fs-extra';
import {createCommonContractErrorPrompt} from './createCommonContractErrorPrompt';
import {createCommonTypescriptErrorPrompt} from './createCommonTypescriptErrorPrompt';
import generate from '@babel/generator';
import {GenerateOCLParam} from './generateOCL';
import {generateOclWithJsonMode} from './generateOclWithJsonMode';
const openAIBaseURL = process.env.OPENAI_BASE_URL || 'https://api.apiyi.com/v1';
const contractSchema = z.object({
  definition: z.string().nullable().describe(whatIsDefination),
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
  const {project: key, useCase: uc, apiKey, messages} = state;
  const systemMessage = [
    createG4Prompt(),
    createDefinitionPrompt(),
    createTransformRulesPrompt(),
    createProjectContextPrompt({project: key, useCase: uc}),
    `Now the user will tell you the operation context and you should help the user generate the code with json format like below:`,
    JSON.stringify({definition: 'code', precondition: 'code', postcondition: 'code'}, null, 2),
    createCommonContractErrorPrompt(),
  ]
    .filter(Boolean)
    .join('\n');
  const newMessages = [new SystemMessage(systemMessage), ...messages];
  const hasError = state.contractErrors?.length > 0 || state.typescriptErrors?.length > 0;
  if (hasError) {
    newMessages.push(new AIMessage(JSON.stringify(state.ocl, null, 2)));
  }
  const errorMessages: string[] = [];
  if (state.contractErrors?.length > 0) {
    errorMessages.push(
      `After I generate the whole contract from my complier with your response, I found these errors, please fix them for me.`
    );
    errorMessages.push(`The contract is below:`);
    errorMessages.push(state.contract);
    state.contractErrors.forEach((e) =>
      errorMessages.push(
        `Contract Error at line ${e.line}, column ${e.column}: ${e.msg}`,
        createCommonContractErrorPrompt()
      )
    );
  }
  if (state.typescriptErrors?.length > 0) {
    errorMessages.push(
      `After I generate the whole contract from my complier and then I generate the typescript from the contract, I found these errors, please fix them for me.`
    );
    state.typescriptErrors.forEach((e) =>
      errorMessages.push(
        `TypeScript Error at line ${e.line}, column ${e.column}: ${e.msg}`,
        createCommonTypescriptErrorPrompt()
      )
    );
  }
  if (errorMessages.length) {
    newMessages.push(new HumanMessage(errorMessages.join('\n')));
  }

  const ocl = await generateOclWithJsonMode({
    model: state.model,
    apiKey,
    baseURL: openAIBaseURL,
    messages: newMessages,
    schema: contractSchema,
  });
  console.log(...newMessages.map((m) => m.getType().bgBlue + ': ' + m.content + '\n'));
  return {ocl, model: state.model, userInput: state.userInput};
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
  const {errors, tree, tokens} = parse(contract);
  return {
    contractErrors: errors,
    contract: errors.length === 0 ? formatContract(tree!, tokens) : contract,
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
  const time = new Date().getTime();
  const testDir = path.resolve(process.cwd(), 'test');
  const folder = path.resolve(testDir, 'tmp');
  fs.ensureDirSync(folder);
  const fileName = `${key}${serviceName}${operationName}${time}`;
  const testFileName = `${fileName}.test.ts`;
  const testFilePath = path.resolve(folder, testFileName);
  const filePath = path.resolve(folder, `${fileName}.ts`);
  const entryCode = buildEntryCode({
    service: state.typescript!.originalService,
    entity: state.typescript!.originalEntity,
  });
  fs.writeFileSync(filePath, entryCode);
  const originTestFilePath = path.resolve(
    testDir,
    `${key}-${serviceName}-${operationName}/index.test.ts`
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
  const res = await jest.runCLI(
    {
      _: [`test/tmp/${testFileName}`],
      $0: '',
      //   listTests: true,
      json: true,
      coverage: true,
    },
    [process.cwd()]
  );
  const summary = res.results.coverageMap!.getCoverageSummary();
  const result = res.results.testResults[0];
  return {
    typescript: state.typescript,
    contract: state.contract,
    summary,
    result,
  };
};

const builder = new StateGraph(StateAnnotation)
  .addNode('OCL Generator', oclGeneratorNode)
  .addNode('Contract Generator', contractGeneratorNode)
  .addNode('TypeScript Generator', typescriptGeneratorNode)
  .addNode('TypeScript Parser', typescriptParserNode)
  .addNode('Test Result', testResultNode)
  .addEdge('__start__', 'OCL Generator')
  .addEdge('OCL Generator', 'Contract Generator')
  .addEdge('Contract Generator', 'TypeScript Generator')
  .addEdge('TypeScript Generator', 'TypeScript Parser')
  .addEdge('TypeScript Parser', 'Test Result')
  .addEdge('Test Result', '__end__');

export const graph = builder.compile();
