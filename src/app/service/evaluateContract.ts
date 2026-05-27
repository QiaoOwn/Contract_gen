import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
import * as typescript from 'typescript';
import * as jest from 'jest';
import * as babel from '@babel/core';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import generate from '@babel/generator';
import path from 'path';
import fs from 'fs-extra';
import {formatContract, parse} from '../util';
import {buildEntryCode, createEntryCode} from './createEntryCode';
import {createGlobalEntryCode} from './createGlobalEntryCode';

type OclSections = {
  definition?: string | null;
  precondition: string;
  postcondition: string;
};

type EvalParams = {
  project: keyof typeof project;
  useCase: string;
  operation: string;
  contract?: string;
  ocl: OclSections;
};

const toPlainErrors = (errors: unknown[]) =>
  errors.map((e) => {
    if (e && typeof e === 'object') {
      return e;
    }
    return {msg: String(e)};
  });

const parseTypescriptEntry = (entry: string) => {
  const prefix = `baseline_eval/${new Date().getTime()}`;
  const entryFileName = `/${prefix}/entry/index.ts`;
  const globalEntryFileName = `/${prefix}/globalEntry.ts`;
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
  const fileMap: Record<string, string> = {
    [entryFileName]: entry,
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
      getDefaultLibFileName: (options) => typescript.getDefaultLibFilePath(options),
      fileExists: (name) => fileMap[name] !== undefined || fs.existsSync(name),
      readFile: (name) => fileMap[name] ?? (fs.existsSync(name) ? fs.readFileSync(name, 'utf-8') : undefined),
      readDirectory: (dir, extensions) => extensions?.map((ext) => `${dir}/file${ext}`) || [],
      directoryExists: () => true,
      getDirectories: () => [],
    },
    typescript.createDocumentRegistry()
  );
  const diagnostics = [
    ...languageService.getSyntacticDiagnostics(entryFileName),
    ...languageService.getSemanticDiagnostics(entryFileName),
  ];
  return diagnostics.map((diagnostic) => {
    if (diagnostic.file) {
      const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      return {
        line: line + 1,
        column: character + 1,
        msg: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        code: diagnostic.code,
      };
    }
    return {
      msg: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      code: diagnostic.code,
    };
  });
};

const runOperationTests = async (
  key: keyof typeof project,
  uc: string,
  op: string,
  typescriptCode: Awaited<ReturnType<typeof createEntryCode>>
) => {
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
  fs.writeFileSync(
    filePath,
    buildEntryCode({
      service: typescriptCode.originalService,
      entity: typescriptCode.originalEntity,
    })
  );
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
      json: true,
      coverage: true,
    },
    [process.cwd()]
  );
  const result = res.results.testResults[0];
  return {
    passing: result?.numPassingTests || 0,
    failing: result?.numFailingTests || 0,
    pending: result?.numPendingTests || 0,
    testFilePath,
    success: (result?.numPassingTests || 0) > 0 && (result?.numFailingTests || 0) === 0,
  };
};

export const evaluateContract = async ({project: key, useCase: uc, operation: op, contract, ocl}: EvalParams) => {
  const contractParse = contract ? parse(contract) : null;
  const contractErrors = contractParse ? toPlainErrors(contractParse.errors) : [];
  if (contractParse && contractErrors.length > 0) {
    return {
      contract_parse_ok: false,
      contract_errors: contractErrors,
      typescript_generation_ok: false,
      typescript_parse_ok: false,
      typescript_errors: [],
      test_execution_ok: false,
      test_passing_count: 0,
      test_failing_count: 0,
    };
  }
  let typescriptCode: Awaited<ReturnType<typeof createEntryCode>>;
  try {
    typescriptCode = await createEntryCode({
      project: key,
      useCase: uc as never,
      operation: op,
      ocl: {
        definition: ocl.definition || undefined,
        precondition: ocl.precondition,
        postcondition: ocl.postcondition,
      },
    });
  } catch (error) {
    return {
      contract_parse_ok: true,
      contract: contractParse ? formatContract(contractParse.tree!, contractParse.tokens) : contract,
      contract_errors: [],
      typescript_generation_ok: false,
      typescript_generation_error: (error as Error).message,
      typescript_parse_ok: false,
      typescript_errors: [],
      test_execution_ok: false,
      test_passing_count: 0,
      test_failing_count: 0,
    };
  }
  const typescriptErrors = parseTypescriptEntry(typescriptCode.entry);
  if (typescriptErrors.length > 0) {
    return {
      contract_parse_ok: true,
      contract: contractParse ? formatContract(contractParse.tree!, contractParse.tokens) : contract,
      contract_errors: [],
      typescript_generation_ok: true,
      typescript_parse_ok: false,
      typescript_errors: typescriptErrors,
      test_execution_ok: false,
      test_passing_count: 0,
      test_failing_count: 0,
    };
  }
  try {
    const testResult = await runOperationTests(key, uc, op, typescriptCode);
    return {
      contract_parse_ok: true,
      contract: contractParse ? formatContract(contractParse.tree!, contractParse.tokens) : contract,
      contract_errors: [],
      typescript_generation_ok: true,
      typescript_parse_ok: true,
      typescript_errors: [],
      test_execution_ok: testResult.success,
      test_passing_count: testResult.passing,
      test_failing_count: testResult.failing,
      test_pending_count: testResult.pending,
    };
  } catch (error) {
    return {
      contract_parse_ok: true,
      contract: contractParse ? formatContract(contractParse.tree!, contractParse.tokens) : contract,
      contract_errors: [],
      typescript_generation_ok: true,
      typescript_parse_ok: true,
      typescript_errors: [],
      test_execution_ok: false,
      test_execution_error: (error as Error).message,
      test_passing_count: 0,
      test_failing_count: 0,
    };
  }
};
