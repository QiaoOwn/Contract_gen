import * as babel from '@babel/core';
import generate from '@babel/generator';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import fs from 'fs-extra';
import * as jest from 'jest';
import path from 'path';
import {ContractSeparator} from '../src/app/ContractSeparator';
import {createEntryCode} from '../src/app/service/createEntryCode';
import {createGlobalEntryCode} from '../src/app/service/createGlobalEntryCode';
import {UseCase} from '../src/rm2pt/model/UseCase';
import * as projects from '../src/rm2pt/project';

type Attempt = {
  operation_id?: string;
  model?: string;
  attempt?: number;
  syntax_valid?: boolean;
  extraction_success?: boolean;
  extracted_ocl?: string;
  contract?: string;
};

type ManifestRow = {
  id: string;
  project: string;
  useCase: string;
  operation?: string;
  operation_name?: string;
};

const argument = (name: string, fallback = '') => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const operationId = argument('--operation-id');
const model = argument('--model', 'gpt-5.5');
const attemptsPath = path.resolve(
  process.cwd(),
  argument(
    '--attempts',
    'results/contractgen-study-v6/contract_gen/full_feedback/gpt-5.5/attempts.jsonl'
  )
);
const outputPath = path.resolve(
  process.cwd(),
  argument('--output', `results/semantic-captures/${operationId}.json`)
);

const safeName = (value: string) => value.replace(/[^A-Za-z0-9_.-]+/g, '_').slice(0, 180);

const readJsonLines = <T>(file: string): T[] =>
  fs
    .readFileSync(file, 'utf-8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);

const score = (row: Attempt): [number, number, number, number] => [
  row.syntax_valid ? 1 : 0,
  row.extraction_success ? 1 : 0,
  row.extracted_ocl || row.contract ? 1 : 0,
  -Number(row.attempt || 999),
];

const greater = (left: number[], right: number[]) => {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
};

const selectedAttempt = () => {
  const attempts = readJsonLines<Attempt>(attemptsPath).filter(
    (row) => row.operation_id === operationId && row.model === model
  );
  if (!attempts.length) throw new Error(`No ${model} attempt found for ${operationId}`);
  return attempts.reduce((best, row) => (greater(score(row), score(best)) ? row : best));
};

const resolveOperation = () => {
  const manifest = readJsonLines<ManifestRow>(path.resolve(process.cwd(), 'data/operations.jsonl'));
  const row = manifest.find(({id}) => id === operationId);
  if (!row) throw new Error(`Unknown operation id: ${operationId}`);
  const project = projects[row.project as keyof typeof projects];
  if (!project) throw new Error(`Unknown project: ${row.project}`);
  const useCase = project.useCase[
    row.useCase as keyof typeof project.useCase
  ] as unknown as UseCase;
  if (!useCase) throw new Error(`Unknown use case: ${row.project}/${row.useCase}`);
  const operationName = row.operation || row.operation_name || '';
  const operation = useCase.relatedService.operations.find(({name}) => name === operationName);
  if (!operation) throw new Error(`Unknown operation: ${operationId}`);
  return {
    row,
    projectName: row.project as keyof typeof projects,
    useCaseName: row.useCase,
    operationName,
    serviceName: useCase.relatedService.name,
  };
};

const instrumentation = (serviceName: string, operationName: string, capturePath: string) => `
const __semanticCaptureFs = require('fs');
const __semanticCapturePath = ${JSON.stringify(capturePath)};
const __semanticObjectIds = new WeakMap<object, string>();
let __semanticNextObjectId = 1;
const __semanticId = (value: object) => {
  let id = __semanticObjectIds.get(value);
  if (!id) {
    id = 'o' + __semanticNextObjectId++;
    __semanticObjectIds.set(value, id);
  }
  return id;
};
const __semanticSnapshot = (service: object, args: unknown[], result?: unknown) => {
  const queue: object[] = [];
  const queued = new Set<object>();
  const enqueue = (value: object) => {
    if (!queued.has(value)) {
      queued.add(value);
      queue.push(value);
    }
    return __semanticId(value);
  };
  const encode = (value: any): any => {
    if (value === undefined) return {kind: 'undefined'};
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (dayjs.isDayjs(value)) return {kind: 'date', epochMillis: value.valueOf()};
    if (value instanceof Date) return {kind: 'date', epochMillis: value.getTime()};
    if (Array.isArray(value)) return {kind: 'collection', ordered: true, items: value.map(encode)};
    if (value instanceof Set) return {kind: 'collection', ordered: false, items: [...value].map(encode)};
    if (typeof value === 'object') return {kind: 'ref', id: enqueue(value)};
    return {kind: 'unsupported', value: String(value)};
  };
  const repositories = [...map.entries()].map(([clazz, members]) => ({
    className: clazz.name,
    members: members.map((member: object) => enqueue(member)),
  }));
  const rootId = enqueue(service);
  const encodedArgs = args.map(encode);
  const encodedResult = encode(result);
  const objects: any[] = [];
  while (queue.length) {
    const value: any = queue.shift()!;
    const properties: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key === 'string') properties[key] = encode(Reflect.get(value, key));
    }
    objects.push({id: __semanticId(value), className: value.constructor?.name || 'Object', properties});
  }
  return {
    rootId,
    args: encodedArgs,
    result: encodedResult,
    capturedNowMillis: Date.now(),
    repositories,
    objects,
  };
};
const __semanticOriginalOperation = ${serviceName}_AutoGenerated.prototype[${JSON.stringify(operationName)}];
${serviceName}_AutoGenerated.prototype[${JSON.stringify(operationName)}] = function (...args: unknown[]) {
  const before = __semanticSnapshot(this, args);
  let result: unknown;
  let thrown: unknown;
  try {
    result = __semanticOriginalOperation.apply(this, args);
    return result;
  } catch (error) {
    thrown = error;
    throw error;
  } finally {
    const after = __semanticSnapshot(this, args, result);
    const currentTestName = (globalThis as any).expect?.getState?.().currentTestName || '';
    __semanticCaptureFs.appendFileSync(__semanticCapturePath, JSON.stringify({
      operationId: ${JSON.stringify(operationId)},
      currentTestName,
      before,
      after,
      errorName: thrown instanceof Error ? thrown.constructor.name : '',
      errorMessage: thrown instanceof Error ? thrown.message : '',
    }) + '\\n', 'utf-8');
  }
};
`;

const adaptTest = (sourcePath: string, serviceName: string) => {
  const ast = babel.parse(fs.readFileSync(sourcePath, 'utf-8'), {
    filename: sourcePath,
    presets: [presetTypescript],
  })!;
  babel.traverse(ast, {
    enter(nodePath) {
      if (nodePath.isIdentifier({name: serviceName})) {
        nodePath.node.name = `${serviceName}_AutoGenerated`;
      }
    },
  });
  return generate(ast).code;
};

const main = async () => {
  if (!operationId) throw new Error('--operation-id is required');
  const resolved = resolveOperation();
  const attempt = selectedAttempt();
  const contract = attempt.extracted_ocl || attempt.contract || '';
  const separated = new ContractSeparator().separate(contract) as {
    definition?: string;
    precondition: string;
    postcondition: string;
  };
  const generated = await createEntryCode({
    project: resolved.projectName,
    useCase: resolved.useCaseName as never,
    operation: resolved.operationName,
    ocl: separated,
  });

  const temporaryRoot = path.resolve(
    process.cwd(),
    'test/tmp/semantic-capture',
    safeName(operationId)
  );
  const caseRoot = path.resolve(temporaryRoot, 'case');
  const capturePath = path.resolve(temporaryRoot, 'captures.jsonl');
  fs.removeSync(temporaryRoot);
  fs.ensureDirSync(caseRoot);
  fs.copySync(path.resolve(process.cwd(), 'test/helpers'), path.resolve(temporaryRoot, 'helpers'));
  fs.writeFileSync(path.resolve(temporaryRoot, 'globalEntry.ts'), createGlobalEntryCode());
  fs.writeFileSync(
    path.resolve(caseRoot, 'entry.ts'),
    generated.entry + instrumentation(resolved.serviceName, resolved.operationName, capturePath)
  );
  const sourceTest = path.resolve(
    process.cwd(),
    'test',
    `${resolved.row.project}-${resolved.serviceName}-${resolved.operationName}`,
    'index.test.ts'
  );
  if (!fs.existsSync(sourceTest)) throw new Error(`Missing Jest oracle: ${sourceTest}`);
  fs.writeFileSync(
    path.resolve(caseRoot, 'index.test.ts'),
    adaptTest(sourceTest, resolved.serviceName)
  );

  const execution = await jest.runCLI(
    {
      _: [],
      $0: 'capture-semantic-operation',
      roots: [temporaryRoot],
      runInBand: true,
      silent: true,
    },
    [process.cwd()]
  );
  const testStatuses = new Map<string, {status: string; failure: string}>();
  for (const suite of execution.results.testResults) {
    for (const test of suite.testResults) {
      testStatuses.set(test.fullName, {
        status: test.status,
        failure: test.failureMessages.join('\n').slice(0, 3000),
      });
    }
  }
  const captures: Array<
    Record<string, unknown> & {testStatus: string; testFailure: string; errorName?: unknown}
  > = fs.existsSync(capturePath)
    ? readJsonLines<Record<string, unknown>>(capturePath).map((capture) => ({
        ...capture,
        testStatus: testStatuses.get(String(capture.currentTestName || ''))?.status || 'unknown',
        testFailure: testStatuses.get(String(capture.currentTestName || ''))?.failure || '',
      }))
    : [];
  const result = {
    operationId,
    model,
    sourceAttempt: attempt.attempt,
    contract,
    testSuites: {
      passed: execution.results.numPassedTestSuites,
      failed: execution.results.numFailedTestSuites,
      total: execution.results.numTotalTestSuites,
    },
    tests: {
      passed: execution.results.numPassedTests,
      failed: execution.results.numFailedTests,
      pending: execution.results.numPendingTests,
      total: execution.results.numTotalTests,
    },
    captures,
    success: execution.results.success && captures.length > 0,
  };
  fs.ensureDirSync(path.dirname(outputPath));
  fs.writeJSONSync(outputPath, result, {spaces: 2});
  process.stdout.write(
    JSON.stringify(
      {
        operationId,
        tests: result.tests,
        captureCount: captures.length,
        successfulCalls: captures.filter((row) => !row.errorName).length,
        rejectedCalls: captures.filter((row) => row.errorName === 'PreconditionError').length,
        success: result.success,
      },
      null,
      2
    ) + '\n'
  );
};

main().catch((error) => {
  const failure = {
    operationId,
    success: false,
    fatalError: error instanceof Error ? error.stack || error.message : String(error),
  };
  fs.ensureDirSync(path.dirname(outputPath));
  fs.writeJSONSync(outputPath, failure, {spaces: 2});
  console.error(failure.fatalError);
  process.exitCode = 1;
});
