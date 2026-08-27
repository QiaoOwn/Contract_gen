import * as babel from '@babel/core';
import generate from '@babel/generator';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import fs from 'fs-extra';
import * as jest from 'jest';
import path from 'path';
import {ContractSeparator} from '@/app/ContractSeparator';
import {createEntryCode} from '@/app/service/createEntryCode';
import {createGlobalEntryCode} from '@/app/service/createGlobalEntryCode';
import {UseCase} from '@/rm2pt/model/UseCase';
import * as projects from '@/rm2pt/project';

type Source = {
  id: string;
  setting: string;
  attemptsPath: string;
};

type AttemptRecord = Record<string, unknown> & {
  study_version?: string;
  input_schema_version?: string;
  input_hash?: string;
  prompt_hash?: string;
  shared_prompt_hash?: string;
  generation_prompt_version?: string;
  operation_id?: string;
  case_study?: string;
  project?: string;
  useCase?: string;
  operation?: string;
  operation_name?: string;
  model?: string;
  attempt?: number;
  syntax_valid?: boolean;
  extracted_ocl?: string;
  contract?: string;
  definition?: string | null;
  precondition?: string;
  postcondition?: string;
};

type CandidateResult = {
  source: string;
  setting: string;
  model: string;
  operationId: string;
  attempt: number;
  syntaxValid: boolean;
  generated: boolean;
  passed: boolean;
  failureStage?: 'metadata' | 'separation' | 'generation' | 'execution';
  error?: string;
};

type GeneratedCandidate = {
  resultIndex: number;
  testPath: string;
};

const cwd = process.cwd();
const studyVersion = 'contractgen-study-v6';
const inputSchemaVersion = 'contractgen-operation-input-v3';
const resultRoot = path.resolve(cwd, 'results', studyVersion);
const outputRoot = path.resolve(resultRoot, 'validation', 'ocltsvm_hybrid_revalidation');
const testRoot = path.resolve(cwd, 'test');
const temporaryRoot = path.resolve(testRoot, 'tmp', 'ocltsvm-result-revalidation');

const fixedSources: Array<[string, string, string]> = [
  ['contract-gen-full-feedback', 'full_feedback', 'contract_gen/full_feedback'],
  ['contract-gen-no-feedback', 'no_feedback', 'contract_gen/no_feedback'],
  ['contract-gen-generic-feedback', 'generic_feedback', 'contract_gen/generic_feedback'],
  ['codex-prompt-style', 'codex_prompt_style', 'baselines/codexprompt'],
  ['pathocl-style', 'pathocl_style', 'baselines/pathocl'],
  ['purellm', 'pure_llm', 'baselines/purellm'],
  ['end-to-end-full-feedback', 'end_to_end_full_feedback', 'ablations/end_to_end_full_feedback'],
];

const configuredSources: Source[] = fixedSources.map(([id, setting, relativeDirectory]) => ({
  id,
  setting,
  attemptsPath: path.resolve(resultRoot, relativeDirectory, 'attempts.jsonl'),
}));
const sources = configuredSources.filter((source) => fs.existsSync(source.attemptsPath));
const missingSources = configuredSources.filter((source) => !fs.existsSync(source.attemptsPath));

const compactError = (error: unknown) =>
  (error instanceof Error ? (error.stack ?? error.message) : String(error))
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r/g, '')
    .slice(0, 3000);

const manifestRows = fs
  .readFileSync(path.resolve(cwd, 'data', 'operations.jsonl'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Invalid data/operations.jsonl line ${index + 1}: ${compactError(error)}`);
    }
  });
const manifestByOperation = new Map(
  manifestRows.map((row) => [String(row.id ?? ''), row] as const)
);
if (manifestRows.length !== 114 || manifestByOperation.size !== 114) {
  throw new Error(
    `Expected 114 unique canonical operations, found ${manifestRows.length} rows and ` +
      `${manifestByOperation.size} ids`
  );
}

const resetTemporaryRoot = () => {
  const expectedParent = path.resolve(testRoot, 'tmp');
  if (!temporaryRoot.startsWith(`${expectedParent}${path.sep}`)) {
    throw new Error(`Refusing to reset unexpected path: ${temporaryRoot}`);
  }
  fs.removeSync(temporaryRoot);
  fs.ensureDirSync(temporaryRoot);
  fs.copySync(path.resolve(testRoot, 'helpers'), path.resolve(temporaryRoot, 'helpers'));
  fs.writeFileSync(path.resolve(temporaryRoot, 'globalEntry.ts'), createGlobalEntryCode());
};

const readAttempts = (attemptsPath: string): AttemptRecord[] =>
  fs
    .readFileSync(attemptsPath, 'utf-8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      let record: AttemptRecord;
      try {
        record = JSON.parse(line) as AttemptRecord;
      } catch (error) {
        throw new Error(`${attemptsPath}:${index + 1}: invalid JSON: ${compactError(error)}`);
      }
      const operationId = String(record.operation_id ?? '');
      const manifest = manifestByOperation.get(operationId);
      const sharedPromptHash = record.shared_prompt_hash ?? record.prompt_hash;
      const mismatches = [
        record.study_version === studyVersion ? '' : `study_version=${record.study_version}`,
        record.input_schema_version === inputSchemaVersion
          ? ''
          : `input_schema_version=${record.input_schema_version}`,
        manifest ? '' : `unknown operation_id=${operationId}`,
        manifest && record.input_hash === manifest.input_hash
          ? ''
          : `input_hash=${record.input_hash}`,
        manifest && sharedPromptHash === manifest.prompt_hash
          ? ''
          : `shared_prompt_hash=${sharedPromptHash}`,
        record.generation_prompt_version ? '' : 'missing generation_prompt_version',
      ].filter(Boolean);
      if (mismatches.length) {
        throw new Error(
          `${attemptsPath}:${index + 1}: incompatible experiment record: ${mismatches.join(', ')}`
        );
      }
      return record;
    });

const resolveOperation = (record: AttemptRecord) => {
  const operationId = String(record.operation_id ?? '');
  const recordedProject = String(record.project ?? record.case_study ?? '');
  const projectName =
    recordedProject in projects
      ? recordedProject
      : Object.keys(projects).find((name) => operationId.startsWith(`${name}_`)) || '';
  const operationName = String(record.operation ?? record.operation_name ?? '');
  let useCaseName = String(record.useCase ?? '');
  if (!useCaseName && operationId && projectName && operationName) {
    const prefix = `${projectName}_`;
    const suffix = `_${operationName}`;
    if (operationId.startsWith(prefix) && operationId.endsWith(suffix)) {
      useCaseName = operationId.slice(prefix.length, -suffix.length);
    }
  }
  if (!projectName || !useCaseName || !operationName || !operationId) {
    throw new Error(`Incomplete operation metadata for ${operationId || '<unknown>'}`);
  }
  const project = projects[projectName as keyof typeof projects];
  if (!project) {
    throw new Error(`Unknown project: ${projectName}`);
  }
  const useCase = project.useCase[useCaseName as keyof typeof project.useCase] as unknown as
    | UseCase
    | undefined;
  if (!useCase) {
    throw new Error(`Unknown use case: ${projectName}/${useCaseName}`);
  }
  const operation = useCase.relatedService.operations.find(({name}) => name === operationName);
  if (!operation) {
    throw new Error(`Unknown operation: ${projectName}/${useCaseName}/${operationName}`);
  }
  return {
    projectName: projectName as keyof typeof projects,
    useCaseName,
    operationName,
    operationId,
    serviceName: useCase.relatedService.name,
  };
};

const separateContract = (record: AttemptRecord) => {
  if (record.precondition && record.postcondition) {
    return {
      definition: record.definition || undefined,
      precondition: record.precondition,
      postcondition: record.postcondition,
    };
  }
  const contract = record.extracted_ocl || record.contract;
  if (!contract) {
    throw new Error('No saved contract or OCL clauses');
  }
  return new ContractSeparator().separate(contract) as {
    definition?: string;
    precondition: string;
    postcondition: string;
  };
};

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

const evaluateSource = async (source: Source, allResults: CandidateResult[]) => {
  resetTemporaryRoot();
  const records = readAttempts(source.attemptsPath);
  const generated: GeneratedCandidate[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => undefined;
  console.error = () => undefined;
  try {
    for (const record of records) {
      const model = String(record.model ?? 'unknown');
      const operationId = String(record.operation_id ?? 'unknown');
      const attempt = Number(record.attempt ?? 0);
      const resultIndex =
        allResults.push({
          source: source.id,
          setting: source.setting,
          model,
          operationId,
          attempt,
          syntaxValid: record.syntax_valid === true,
          generated: false,
          passed: false,
        }) - 1;
      if (record.syntax_valid !== true) {
        continue;
      }
      let resolved: ReturnType<typeof resolveOperation>;
      try {
        resolved = resolveOperation(record);
      } catch (error) {
        Object.assign(allResults[resultIndex], {
          failureStage: 'metadata',
          error: compactError(error),
        });
        continue;
      }
      let ocl: ReturnType<typeof separateContract>;
      try {
        ocl = separateContract(record);
      } catch (error) {
        Object.assign(allResults[resultIndex], {
          failureStage: 'separation',
          error: compactError(error),
        });
        continue;
      }
      try {
        const code = await createEntryCode({
          project: resolved.projectName,
          useCase: resolved.useCaseName as never,
          operation: resolved.operationName,
          ocl,
        });
        const caseDirectory = path.resolve(
          temporaryRoot,
          `candidate-${String(generated.length).padStart(4, '0')}`
        );
        fs.ensureDirSync(caseDirectory);
        fs.writeFileSync(path.resolve(caseDirectory, 'entry.ts'), code.entry);
        const sourceTest = path.resolve(
          testRoot,
          `${resolved.projectName}-${resolved.serviceName}-${resolved.operationName}`,
          'index.test.ts'
        );
        const testPath = path.resolve(caseDirectory, 'index.test.ts');
        fs.writeFileSync(testPath, adaptTest(sourceTest, resolved.serviceName));
        allResults[resultIndex].generated = true;
        generated.push({resultIndex, testPath});
      } catch (error) {
        Object.assign(allResults[resultIndex], {
          failureStage: 'generation',
          error: compactError(error),
        });
      }
    }
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  if (generated.length > 0) {
    const run = await jest.runCLI(
      {
        _: [],
        $0: 'revalidate-ocltsvm-results',
        coverage: false,
        reporters: [],
        roots: [temporaryRoot],
        runInBand: true,
        silent: true,
      },
      [cwd]
    );
    const byPath = new Map(
      generated.map((candidate) => [path.resolve(candidate.testPath).toLowerCase(), candidate])
    );
    run.results.testResults.forEach((suite) => {
      const candidate = byPath.get(path.resolve(suite.testFilePath).toLowerCase());
      if (!candidate) {
        return;
      }
      const passed =
        suite.numPassingTests > 0 && suite.numFailingTests === 0 && !suite.failureMessage;
      allResults[candidate.resultIndex].passed = passed;
      if (!passed) {
        allResults[candidate.resultIndex].failureStage = 'execution';
        allResults[candidate.resultIndex].error = compactError(
          suite.failureMessage ||
            suite.testResults.flatMap((assertion) => assertion.failureMessages).join('\n')
        );
      }
    });
  }

  const generatedCount = generated.length;
  const passedCount = generated.filter(({resultIndex}) => allResults[resultIndex].passed).length;
  process.stdout.write(
    `${source.id}: ${records.length} attempts, ${generatedCount} generated, ${passedCount} passed\n`
  );
};

const csvEscape = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const writeOutputs = (results: CandidateResult[]) => {
  fs.ensureDirSync(outputRoot);
  fs.writeFileSync(
    path.resolve(outputRoot, 'candidates.jsonl'),
    `${results.map((result) => JSON.stringify(result)).join('\n')}\n`
  );

  const grouped = new Map<string, CandidateResult[]>();
  results.forEach((result) => {
    const key = `${result.setting}\u0000${result.model}`;
    grouped.set(key, [...(grouped.get(key) ?? []), result]);
  });
  const summary = [...grouped.entries()]
    .map(([key, group]) => {
      const [setting, model] = key.split('\u0000');
      const operations = new Map<string, CandidateResult[]>();
      group.forEach((candidate) => {
        operations.set(candidate.operationId, [
          ...(operations.get(candidate.operationId) ?? []),
          candidate,
        ]);
      });
      const operationGroups = [...operations.values()];
      const syntaxValidOperations = operationGroups.filter((attempts) =>
        attempts.some(({syntaxValid}) => syntaxValid)
      ).length;
      const executionPassOperations = operationGroups.filter((attempts) =>
        attempts.some(({passed}) => passed)
      ).length;
      const firstAttemptPassOperations = operationGroups.filter((attempts) =>
        attempts.some(({attempt, passed}) => attempt === 1 && passed)
      ).length;
      return {
        setting,
        model,
        totalOperations: operations.size,
        totalAttempts: group.length,
        syntaxValidOperations,
        syntaxValidRate: (100 * syntaxValidOperations) / operations.size,
        executionPassOperations,
        executionPassRate: (100 * executionPassOperations) / operations.size,
        firstAttemptPassOperations,
        firstAttemptPassRate: (100 * firstAttemptPassOperations) / operations.size,
        generatedCandidates: group.filter(({generated}) => generated).length,
        generationFailures: group.filter(({failureStage}) => failureStage === 'generation').length,
      };
    })
    .sort((left, right) =>
      `${left.setting}/${left.model}`.localeCompare(`${right.setting}/${right.model}`)
    );

  fs.writeJSONSync(path.resolve(outputRoot, 'summary.json'), summary, {spaces: 2});
  const columns = Object.keys(summary[0] ?? {});
  fs.writeFileSync(
    path.resolve(outputRoot, 'summary.csv'),
    `${columns.join(',')}\n${summary
      .map((row) => columns.map((column) => csvEscape(row[column as keyof typeof row])).join(','))
      .join('\n')}\n`
  );
  return summary;
};

const main = async () => {
  if (missingSources.length > 0) {
    throw new Error(
      `Incomplete ${studyVersion} result set. Missing: ` +
        missingSources.map(({attemptsPath}) => attemptsPath).join(', ')
    );
  }
  const results: CandidateResult[] = [];
  for (const source of sources) {
    await evaluateSource(source, results);
    writeOutputs(results);
  }
  const summary = writeOutputs(results);
  resetTemporaryRoot();
  fs.removeSync(temporaryRoot);
  process.stdout.write(
    `${JSON.stringify({sources: sources.length, candidates: results.length, groups: summary.length}, null, 2)}\n`
  );
};

main().catch((error) => {
  console.error(compactError(error));
  process.exitCode = 1;
});
