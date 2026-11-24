import dayjs from 'dayjs';
import * as babel from '@babel/core';
import generate from '@babel/generator';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import * as t from '@babel/types';
import fs from 'fs-extra';
import path from 'path';
import {createHash} from 'crypto';
import {pathToFileURL} from 'url';
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
  return_type?: string;
};

type StateMutation = {
  mutation_id: string;
  operation_id: string;
  typescript_statement: string;
  mutates_result?: boolean;
  obligation_family?: string;
  prestate_seed?: {
    id: string;
    class_name: string;
    properties?: Record<string, EncodedValue>;
  };
  entry_replacements?: Array<{
    from: string;
    to: string;
  }>;
};

type EncodedValue = null | string | number | boolean | {kind: string; [key: string]: unknown};

type Snapshot = {
  rootId: string;
  args: EncodedValue[];
  result: EncodedValue;
  capturedNowMillis?: number;
  repositories: Array<{className: string; members: string[]}>;
  objects: Array<{
    id: string;
    className: string;
    properties: Record<string, EncodedValue>;
  }>;
};

const argument = (name: string, fallback = '') => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const operationId = argument('--operation-id');
const model = argument('--model', 'gpt-5.5');
const cohortPath = argument('--cohort');
const inputPath = path.resolve(
  process.cwd(),
  argument('--input', 'data/benchmark/v6/operations-contractgen-study-v6.jsonl')
);
const attemptsPath = path.resolve(
  process.cwd(),
  argument(
    '--attempts',
    'results/contractgen-study-v6/contract_gen/full_feedback/gpt-5.5/attempts.jsonl'
  )
);
const capturePath = path.resolve(process.cwd(), argument('--capture'));
const captureIndexText = argument('--capture-index');
const mode = argument('--mode', 'result-mutant');
const mutationManifestPath = argument('--mutation-manifest');
const mutationId = argument('--mutation-id');
const mutationOverridesPath = argument('--mutation-overrides');
const checkerEnabled = !process.argv.includes('--disable-checker');

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

const selectAttempt = () => {
  if (cohortPath) {
    const candidates = readJsonLines<Attempt & {contract_sha256?: string}>(
      path.resolve(process.cwd(), cohortPath)
    ).filter((row) => row.operation_id === operationId);
    if (candidates.length !== 1) {
      throw new Error(`Expected exactly one frozen cohort candidate for ${operationId}`);
    }
    const selected = candidates[0];
    if (createHash('sha256').update(selected.contract || '').digest('hex') !== selected.contract_sha256) {
      throw new Error(`Frozen cohort contract hash mismatch for ${operationId}`);
    }
    return selected;
  }
  const rows = readJsonLines<Attempt>(attemptsPath).filter(
    (row) => row.operation_id === operationId && row.model === model
  );
  if (!rows.length) throw new Error(`No ${model} attempt found for ${operationId}`);
  return rows.reduce((best, row) => (greater(score(row), score(best)) ? row : best));
};

const selectStateMutation = (): StateMutation | undefined => {
  if (!mutationManifestPath && !mutationId) return undefined;
  if (!mutationManifestPath || !mutationId) {
    throw new Error('--mutation-manifest and --mutation-id must be provided together');
  }
  const manifest = fs.readJSONSync(path.resolve(process.cwd(), mutationManifestPath));
  const mutation = (manifest.mutations || []).find(
    (row: StateMutation) => row.mutation_id === mutationId
  ) as StateMutation | undefined;
  if (!mutation) throw new Error(`Unknown state mutation: ${mutationId}`);
  if (mutation.operation_id !== operationId) {
    throw new Error(`Mutation ${mutationId} does not target ${operationId}`);
  }
  if (!mutationOverridesPath) return mutation;
  const overrides = fs.readJSONSync(path.resolve(process.cwd(), mutationOverridesPath));
  const replacement = (overrides.mutations || []).find(
    (row: StateMutation & {source_mutation_id: string}) => row.source_mutation_id === mutationId
  ) as (StateMutation & {source_mutation_id: string}) | undefined;
  if (!replacement) return mutation;
  if (replacement.operation_id !== operationId) {
    throw new Error(`Override ${replacement.mutation_id} does not target ${operationId}`);
  }
  return {...mutation, ...replacement};
};

const resolveOperation = () => {
  const manifest = readJsonLines<ManifestRow>(
    inputPath
  );
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

const resultMutationStatement = (returnType: string) => {
  if (returnType === 'Boolean') return 'result = !result;';
  if (returnType === 'Integer' || returnType === 'Real') return 'result = result + 1;';
  if (returnType === 'String') return "result = result + '__CONTRACTGEN_MUTANT__';";
  throw new Error(`Unsupported scalar result type: ${returnType}`);
};

const instrumentResult = (entry: string, returnType: string, stateMutation?: StateMutation) => {
  const resultDeclaration = 'const result = (() => {';
  const postStateMarker = '/*OCL Post-state Snapshot*/';
  if (!entry.includes(resultDeclaration) || !entry.includes(postStateMarker)) {
    throw new Error('Generated operation lacks the expected result or post-state marker');
  }
  if (mode === 'control') {
    return entry.replace(
      postStateMarker,
      `(globalThis as any).__contractgenMutantResult = result;\n    ${postStateMarker}`
    );
  }
  if (mode === 'state-mutant') {
    if (!stateMutation) throw new Error('State-mutant mode requires a mutation specification');
    const mutableEntry = stateMutation.mutates_result
      ? entry.replace(resultDeclaration, 'let result = (() => {')
      : entry;
    return mutableEntry.replace(
      postStateMarker,
      `${stateMutation.typescript_statement}\n    ` +
        `(globalThis as any).__contractgenMutantResult = result;\n    ${postStateMarker}`
    );
  }
  if (mode !== 'result-mutant') throw new Error(`Unsupported --mode: ${mode}`);
  return entry
    .replace(resultDeclaration, 'let result = (() => {')
    .replace(
      postStateMarker,
      `${resultMutationStatement(returnType)}\n    ` +
        `(globalThis as any).__contractgenMutantResult = result;\n    ${postStateMarker}`
    );
};

const applyEntryReplacements = (entry: string, stateMutation?: StateMutation) => {
  if (mode !== 'state-mutant' || !stateMutation?.entry_replacements?.length) {
    return entry;
  }
  return stateMutation.entry_replacements.reduce((current, replacement) => {
    const first = current.indexOf(replacement.from);
    const last = current.lastIndexOf(replacement.from);
    if (first < 0 || first !== last) {
      throw new Error(
        `Mutation ${stateMutation.mutation_id} expected exactly one entry occurrence of: ${replacement.from}`
      );
    }
    return current.replace(replacement.from, replacement.to);
  }, entry);
};

const removePostconditionChecker = (entry: string, operationName: string) => {
  const ast = babel.parse(entry, {filename: 'entry.ts', presets: [presetTypescript]})!;
  let declarationsRemoved = 0;
  let guardsRemoved = 0;
  babel.traverse(ast, {
    ClassMethod(methodPath) {
      const key = methodPath.node.key;
      const name = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : '';
      if (name !== operationName) return;
      methodPath.node.body.body = methodPath.node.body.body.filter((statement) => {
        if (t.isVariableDeclaration(statement)) {
          const isChecker = statement.declarations.some(
            ({id}) =>
              t.isObjectPattern(id) &&
              id.properties.some(
                (property) =>
                  t.isObjectProperty(property) &&
                  t.isIdentifier(property.value, {name: 'isPostconditionPass'})
              )
          );
          if (isChecker) {
            declarationsRemoved += 1;
            return false;
          }
        }
        if (
          t.isIfStatement(statement) &&
          t.isUnaryExpression(statement.test, {operator: '!'}) &&
          t.isIdentifier(statement.test.argument, {name: 'isPostconditionPass'})
        ) {
          guardsRemoved += 1;
          return false;
        }
        return true;
      });
    },
  });
  if (declarationsRemoved !== 1 || guardsRemoved !== 1) {
    throw new Error(
      `Expected one postcondition checker and guard, removed ${declarationsRemoved}/${guardsRemoved}`
    );
  }
  return generate(ast).code;
};

const restoreSnapshot = (runtime: Record<string, any>, snapshot: Snapshot, serviceName: string) => {
  const values = new Map<string, any>();
  const reverseIds = new WeakMap<object, string>();
  const rootClassName = `${serviceName}_AutoGenerated`;
  for (const row of snapshot.objects) {
    const Constructor =
      row.id === snapshot.rootId ? runtime[rootClassName] : runtime[row.className];
    if (!Constructor) throw new Error(`Generated runtime lacks class ${row.className}`);
    const value = new Constructor();
    values.set(row.id, value);
    reverseIds.set(value, row.id);
  }
  const decode = (value: EncodedValue): any => {
    if (value === null || typeof value !== 'object') return value;
    if (value.kind === 'undefined') return undefined;
    if (value.kind === 'date') return dayjs(Number(value.epochMillis));
    if (value.kind === 'ref') return values.get(String(value.id));
    if (value.kind === 'collection') {
      const items = ((value.items as EncodedValue[]) || []).map(decode);
      return value.ordered ? items : new Set(items);
    }
    throw new Error(`Unsupported encoded value kind: ${value.kind}`);
  };
  for (const row of snapshot.objects) {
    const value = values.get(row.id);
    for (const [name, encoded] of Object.entries(row.properties || {})) {
      value[name] = decode(encoded);
    }
  }
  for (const repository of snapshot.repositories) {
    const Constructor = runtime[repository.className];
    if (!Constructor) continue;
    const target = runtime.getRepository(Constructor) as any[];
    target.splice(0, target.length, ...repository.members.map((id) => values.get(id)));
  }
  return {
    root: values.get(snapshot.rootId),
    args: snapshot.args.map(decode),
    values,
    reverseIds,
    decode,
  };
};

const seedPrestate = (
  runtime: Record<string, any>,
  restored: ReturnType<typeof restoreSnapshot>,
  stateMutation?: StateMutation
) => {
  const seed = stateMutation?.prestate_seed;
  if (!seed) return;
  if (restored.values.has(seed.id)) {
    throw new Error(`Pre-state seed id already exists: ${seed.id}`);
  }
  const Constructor = runtime[seed.class_name];
  if (!Constructor) throw new Error(`Generated runtime lacks seed class ${seed.class_name}`);
  const value = new Constructor();
  for (const [name, encoded] of Object.entries(seed.properties || {})) {
    value[name] = restored.decode(encoded);
  }
  const repository = runtime.getRepository(Constructor) as any[];
  repository.push(value);
  restored.values.set(seed.id, value);
  restored.reverseIds.set(value, seed.id);
};

const freezeClock = (epochMillis: number | undefined) => {
  const NativeDate = Date;
  if (!Number.isFinite(epochMillis)) return () => undefined;
  class FrozenDate extends NativeDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(Number(epochMillis));
      } else {
        super(args[0]);
      }
    }

    static now() {
      return Number(epochMillis);
    }
  }
  (globalThis as any).Date = FrozenDate;
  return () => {
    (globalThis as any).Date = NativeDate;
  };
};

const encodeRuntimeSnapshot = (
  runtime: Record<string, any>,
  restored: ReturnType<typeof restoreSnapshot>,
  source: Snapshot,
  result: unknown
): Snapshot => {
  let nextId = 1;
  const queue: object[] = [];
  const queued = new Set<object>();
  const objectId = (value: object) => {
    const existing = restored.reverseIds.get(value);
    if (existing) return existing;
    let candidate = `new${nextId++}`;
    while ([...restored.values.keys()].includes(candidate)) candidate = `new${nextId++}`;
    restored.reverseIds.set(value, candidate);
    return candidate;
  };
  const enqueue = (value: object) => {
    if (!queued.has(value)) {
      queued.add(value);
      queue.push(value);
    }
    return objectId(value);
  };
  const encode = (value: any): EncodedValue => {
    if (value === undefined) return {kind: 'undefined'};
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
    if (dayjs.isDayjs(value)) return {kind: 'date', epochMillis: value.valueOf()};
    if (value instanceof Date) return {kind: 'date', epochMillis: value.getTime()};
    if (Array.isArray(value)) {
      return {kind: 'collection', ordered: true, items: value.map(encode)};
    }
    if (value instanceof Set) {
      return {kind: 'collection', ordered: false, items: [...value].map(encode)};
    }
    if (typeof value === 'object') return {kind: 'ref', id: enqueue(value)};
    return {kind: 'unsupported', value: String(value)};
  };
  const repositoryRows = source.repositories.map(({className}) => {
    const Constructor = runtime[className];
    const members = Constructor ? (runtime.getRepository(Constructor) as object[]) : [];
    return {className, members: members.map(enqueue)};
  });
  const rootId = enqueue(restored.root);
  const encodedArgs = restored.args.map(encode);
  const encodedResult = encode(result);
  const objects: Snapshot['objects'] = [];
  while (queue.length) {
    const value: any = queue.shift()!;
    const properties: Record<string, EncodedValue> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key === 'string') properties[key] = encode(Reflect.get(value, key));
    }
    objects.push({id: objectId(value), className: value.constructor?.name || 'Object', properties});
  }
  return {
    rootId,
    args: encodedArgs,
    result: encodedResult,
    capturedNowMillis: Date.now(),
    repositories: repositoryRows,
    objects,
  };
};

const main = async () => {
  if (!operationId || !capturePath) throw new Error('--operation-id and --capture are required');
  const resolved = resolveOperation();
  const attempt = selectAttempt();
  const stateMutation = selectStateMutation();
  const captureDocument = fs.readJSONSync(capturePath);
  const captureIndex = captureIndexText ? Number(captureIndexText) : null;
  if (captureIndex !== null && (!Number.isInteger(captureIndex) || captureIndex < 0)) {
    throw new Error('--capture-index must be a non-negative integer');
  }
  const sourceCapture = captureIndex === null
    ? (captureDocument.captures || []).find(
        (row: any) => !row.errorName && row.testStatus === 'passed'
      )
    : (captureDocument.captures || [])[captureIndex];
  if (!sourceCapture) throw new Error('Capture contains no successful operation call');
  if (sourceCapture.errorName || sourceCapture.testStatus !== 'passed') {
    throw new Error('Selected capture is not a successful passing operation call');
  }
  const restoreClock = freezeClock(sourceCapture.before?.capturedNowMillis);
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
    'test/tmp/poststate-result-mutant',
    operationId.replace(/[^A-Za-z0-9_.-]+/g, '_')
  );
  fs.removeSync(temporaryRoot);
  fs.ensureDirSync(path.resolve(temporaryRoot, 'case'));
  fs.writeFileSync(path.resolve(temporaryRoot, 'globalEntry.ts'), createGlobalEntryCode());
  const entryPath = path.resolve(temporaryRoot, 'case/entry.ts');
  const instrumentedEntry = instrumentResult(
    generated.entry,
    String(resolved.row.return_type),
    stateMutation
  );
  const replacedEntry = applyEntryReplacements(instrumentedEntry, stateMutation);
  fs.writeFileSync(
    entryPath,
    checkerEnabled
      ? replacedEntry
      : removePostconditionChecker(replacedEntry, resolved.operationName)
  );
  try {
    const runtime = await import(
      `${pathToFileURL(entryPath).href}?t=${sourceCapture.before?.capturedNowMillis ?? 0}`
    );
    const restored = restoreSnapshot(
      runtime,
      sourceCapture.before as Snapshot,
      resolved.serviceName
    );
    seedPrestate(runtime, restored, stateMutation);
    const before = encodeRuntimeSnapshot(runtime, restored, sourceCapture.before, undefined);
    let decision: boolean | null = true;
    let errorName = '';
    let errorMessage = '';
    try {
      restored.root[resolved.operationName](...restored.args);
    } catch (error) {
      errorName = error instanceof Error ? error.constructor.name : 'UnknownError';
      errorMessage = error instanceof Error ? error.message : String(error);
      decision = errorName === 'PostconditionError' ? false : null;
    }
    const mutantResult = (globalThis as any).__contractgenMutantResult;
    delete (globalThis as any).__contractgenMutantResult;
    const after = encodeRuntimeSnapshot(runtime, restored, sourceCapture.before, mutantResult);
    process.stdout.write(
      JSON.stringify({
        schema_version: stateMutation ? 'poststate-state-mutant-v1' : 'poststate-result-mutant-v1',
        operation_id: operationId,
        mutation_id: stateMutation?.mutation_id ?? null,
        obligation_family: stateMutation?.obligation_family ?? null,
        mode,
        checker_enabled: checkerEnabled,
        source_attempt: attempt.attempt,
        source_capture_index: captureIndex,
        source_test_name: sourceCapture.currentTestName ?? null,
        frozen_now_millis: sourceCapture.before?.capturedNowMillis ?? null,
        decision,
        error_name: errorName,
        error_message: errorMessage,
        before,
        after,
      }) + '\n'
    );
  } finally {
    restoreClock();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
