import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import * as projects from '../src/rm2pt/project';
import type {UseCase} from '../src/rm2pt/model/UseCase';
import {buildModelIndex, MODEL_INDEX_VERSION} from '../src/app/service/modelIndex';
import {buildOperationInput} from '../src/app/service/createOperationInput';
import {
  generateTypescriptEntityFile,
  generateTypescriptServiceFile,
} from '../src/app/service/generateTypescriptCode';
import {readModelSources} from './model_index_sources';
import {
  compareDeclarations,
  expectedPromptDeclarations,
  expectedTypedDeclarations,
  readPromptDeclarations,
  readTypedDeclarations,
} from './model_index_views';

const root = path.resolve(__dirname, '..');
const sha256 = (content: string | Buffer) => createHash('sha256').update(content).digest('hex');
type Row = {
  id: string;
  project: string;
  useCase: string;
  operation_name: string;
  service: string;
  operation_signature: string;
  parameters: {name: string; type: string}[];
  return_type: string | null;
  description: string;
  model_context: string;
  canonical_user_message: string;
  input_hash: string;
  context_hash: string;
};

export const runModelIndexAudit = (input: string, output: string, expectedCount = 114) => {
  const inputFile = path.resolve(input);
  const outputDir = path.resolve(output);
  if (
    !['results', 'tmp'].some((folder) => outputDir.startsWith(path.join(root, folder) + path.sep))
  ) {
    throw new Error('Audit output must be a subdirectory of results or tmp');
  }
  const inputText = fs.readFileSync(inputFile, 'utf8');
  const rows = inputText
    .trimEnd()
    .split(/\r?\n/)
    .map((line, index) => {
      const row = JSON.parse(line) as Row;
      for (const key of [
        'id',
        'project',
        'useCase',
        'operation_name',
        'description',
        'model_context',
        'canonical_user_message',
        'input_hash',
        'context_hash',
        'operation_signature',
        'service',
      ] as const) {
        if (typeof row[key] !== 'string') throw new Error(`Line ${index + 1}: missing ${key}`);
      }
      if (!Array.isArray(row.parameters)) throw new Error(`Line ${index + 1}: missing parameters`);
      return row;
    });
  if (rows.length !== expectedCount || new Set(rows.map((row) => row.id)).size !== expectedCount) {
    throw new Error(`Expected ${expectedCount} unique operations, found ${rows.length} rows`);
  }
  const sourceCatalogs = new Map<string, ReturnType<typeof readModelSources>>();
  for (const project of [...new Set(rows.map((row) => row.project))].sort()) {
    if (!Object.hasOwn(projects, project)) throw new Error(`Unknown project ${project}`);
    sourceCatalogs.set(project, readModelSources(root, project));
  }
  const protectedFiles = new Set([
    inputFile,
    path.join(root, 'config/study-versions.json'),
    path.join(root, 'src/app/service/prompts/generationRules.v5.json'),
    path.join(root, 'src/app/service/prompts/generationGrammar.txt'),
    ...[
      'createOperationInput',
      'createProjectContextPrompt',
      'createOCLGenerationSystemPrompt',
      'createGenerationRulesPrompt',
      'generateTypescriptCode',
      'graph',
      'generationBudget',
      'validateGeneratedContractSemantics',
      'modelGroundingRules',
      'modelIndex',
      'modelSources',
      'operationModelGrounding',
      'validateModelGroundedContract',
      'modelRuleDiagnostics',
      'createOCLGenerationMessages',
      'summarizeJestResults',
      'labAdjudicatedOracle',
    ].map((name) => path.join(root, `src/app/service/${name}.ts`)),
    path.join(root, 'data/benchmark/lab_adjudicated_114_v1/oracle-map.jsonl'),
    path.join(root, 'data/benchmark/lab_adjudicated_114_v1/oracle-suite-lock.json'),
  ]);
  for (const catalog of sourceCatalogs.values()) {
    for (const source of catalog.sourceFiles) protectedFiles.add(path.resolve(root, source.file));
  }
  const fingerprints = [...protectedFiles].sort().map((file) => ({
    file: path.relative(root, file).replaceAll('\\', '/'),
    sha256: sha256(fs.readFileSync(file)),
  }));
  const indexes = rows.map((row) => {
    const model = projects[row.project as keyof typeof projects];
    const useCase = (model.useCase as Record<string, UseCase>)[row.useCase];
    if (!useCase) throw new Error(`${row.id}: unknown use case`);
    return buildModelIndex({
      project: row.project,
      entities: model.entity,
      useCaseKey: row.useCase,
      useCase,
      operationName: row.operation_name,
      resolveSource: sourceCatalogs.get(row.project)!.resolve,
    });
  });
  const details = rows.map((row, position) => {
    const index = indexes[position];
    const model = projects[row.project as keyof typeof projects];
    const useCase = (model.useCase as Record<string, UseCase>)[row.useCase];
    const operation = useCase.relatedService.operations.find(
      (item) => item.name === row.operation_name
    )!;
    const errors: {stage: string; message: string}[] = [];
    const promptDifferences: ReturnType<typeof compareDeclarations> = [];
    const typedDifferences: ReturnType<typeof compareDeclarations> = [];
    const manifestDifferences: string[] = [];
    const missingSources = [
      index.operation,
      ...index.entities,
      ...index.entities.flatMap((entity) => entity.features),
      ...index.operation.serviceState,
      ...index.operation.parameters,
      ...(index.operation.returnType ? [index.operation.returnType] : []),
    ]
      .filter((element) => !element.source)
      .map((element) => element.id);
    const signature = `${index.operation.name}(${index.operation.parameters
      .map((p) => `${p.name}: ${p.type.raw}`)
      .join(
        ', '
      )})${index.operation.returnType ? `: ${index.operation.returnType.type.raw.trim()}` : ''}`;
    if (row.operation_signature !== signature) manifestDifferences.push('operation_signature');
    if (row.service !== index.operation.service) manifestDifferences.push('service');
    if (
      JSON.stringify(row.parameters) !==
      JSON.stringify(index.operation.parameters.map((p) => ({name: p.name, type: p.type.raw})))
    ) {
      manifestDifferences.push('parameters');
    }
    if ((row.return_type || null) !== (index.operation.returnType?.type.raw || null))
      manifestDifferences.push('return_type');
    if (row.id !== `${row.project}_${row.useCase}_${row.operation_name}`)
      manifestDifferences.push('id');
    try {
      const built = buildOperationInput({
        project: row.project as keyof typeof projects,
        useCase: row.useCase as never,
        operation: row.operation_name,
        userInput: row.description,
      });
      for (const [key, actual, expected] of [
        ['model_context', built.modelContext, row.model_context],
        ['canonical_user_message', built.content, row.canonical_user_message],
        ['input_hash', built.metadata.inputHash, row.input_hash],
        ['context_hash', built.metadata.contextHash, row.context_hash],
      ] as const)
        if (actual !== expected) manifestDifferences.push(key);
      promptDifferences.push(
        ...compareDeclarations(
          expectedPromptDeclarations(index),
          readPromptDeclarations(built.modelContext)
        )
      );
      const frozenDifferences = compareDeclarations(
        expectedPromptDeclarations(index),
        readPromptDeclarations(row.model_context)
      );
      for (const difference of frozenDifferences)
        promptDifferences.push({...difference, key: `benchmark/${difference.key}`});
    } catch (error) {
      errors.push({stage: 'prompt-view', message: String(error)});
    }
    try {
      const entityFile = generateTypescriptEntityFile(model.entity, useCase.relatedService);
      // Fixed neutral probe exercises actual signature generation without consulting reference D/P/Q.
      const serviceFile = generateTypescriptServiceFile(useCase.relatedService, [
        {
          ...operation,
          definition: undefined,
          precondition: 'true',
          postcondition: 'true',
        },
      ]).file;
      const typed = new Map([
        ...readTypedDeclarations(entityFile),
        ...readTypedDeclarations(serviceFile, true),
      ]);
      typedDifferences.push(...compareDeclarations(expectedTypedDeclarations(index), typed));
    } catch (error) {
      errors.push({stage: 'typed-view', message: String(error)});
    }
    return {
      id: row.id,
      project: row.project,
      useCase: row.useCase,
      operation: row.operation_name,
      modelIssues: index.issues,
      missingSources,
      manifestDifferences,
      promptDifferences,
      typedDifferences,
      errors,
      status:
        index.issues.length ||
        missingSources.length ||
        manifestDifferences.length ||
        promptDifferences.length ||
        typedDifferences.length ||
        errors.length
          ? 'ISSUES_FOUND'
          : 'CONSISTENT',
    };
  });
  const indexedElements = new Map(
    indexes
      .flatMap((index) => [
        ...index.entities.flatMap((entity) => entity.features),
        ...index.operation.parameters,
        ...index.operation.serviceState,
        ...(index.operation.returnType ? [index.operation.returnType] : []),
      ])
      .map((element) => [element.id, element])
  );
  type IssueEvidence = {
    elementId: string;
    declaration: string;
    source: import('../src/app/service/modelIndex').ModelSource | null;
  };
  const uniqueIssues = new Map<
    string,
    {
      code: string;
      elementIds: string[];
      message: string;
      operationIds: string[];
      evidence: IssueEvidence[];
    }
  >();
  for (const row of details)
    for (const issue of row.modelIssues) {
      const key = JSON.stringify(issue);
      const existing = uniqueIssues.get(key) || {
        ...issue,
        operationIds: [],
        evidence: issue.elementIds.map((id) => ({
          elementId: id,
          declaration: indexedElements.get(id)?.type.raw ?? '',
          source: indexedElements.get(id)?.source ?? null,
        })),
      };
      existing.operationIds.push(row.id);
      uniqueIssues.set(key, existing);
    }
  const unchanged = fingerprints.every(
    (item) => sha256(fs.readFileSync(path.resolve(root, item.file))) === item.sha256
  );
  if (!unchanged) throw new Error('Protected input/source fingerprint changed during audit');
  const summary = {
    auditVersion: MODEL_INDEX_VERSION,
    role: 'offline structural audit only; not active generation or a repair implementation',
    input: path.relative(root, inputFile).replaceAll('\\', '/'),
    inputSha256: sha256(inputText),
    operationCount: rows.length,
    projectCount: sourceCatalogs.size,
    consistentOperations: details.filter((row) => row.status === 'CONSISTENT').length,
    operationsWithModelIssues: details.filter((row) => row.modelIssues.length).length,
    uniqueModelIssues: uniqueIssues.size,
    operationsWithMissingSources: details.filter((row) => row.missingSources.length).length,
    operationsWithManifestDifferences: details.filter((row) => row.manifestDifferences.length)
      .length,
    operationsWithPromptDifferences: details.filter((row) => row.promptDifferences.length).length,
    operationsWithTypedDifferences: details.filter((row) => row.typedDifferences.length).length,
    operationsWithAuditErrors: details.filter((row) => row.errors.length).length,
    protectedFilesUnchanged: unchanged,
    referenceClausesUsed: false,
    jestScenariosUsed: false,
    llmCalls: 0,
    limitations: [
      'Structural agreement is not requirement fidelity, behavioral correctness, or full UML/OCL conformance.',
      'Only one-valued versus Set-valued declarations are recorded; no missing multiplicity bounds or business constraints are inferred.',
      'A fixed true/true probe checks emitted TypeScript declarations, not reference-contract behavior or compilation.',
      'Source locations refer to the current TypeScript project catalog, not original upstream RM2PT requirements.',
    ],
  };
  const formatJson = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
  fs.mkdirSync(outputDir, {recursive: true});
  fs.writeFileSync(path.join(outputDir, 'summary.json'), formatJson(summary));
  fs.writeFileSync(
    path.join(outputDir, 'model_indexes.jsonl'),
    indexes.map((item) => JSON.stringify(item)).join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(outputDir, 'operation_audit.jsonl'),
    details.map((item) => JSON.stringify(item)).join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(outputDir, 'model_issues.json'),
    formatJson([...uniqueIssues.values()])
  );
  fs.writeFileSync(path.join(outputDir, 'protected_files.json'), formatJson(fingerprints));
  const markdownCell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
  const issueTable = [...uniqueIssues.values()]
    .map(
      (issue) =>
        `| ${issue.code} | ${issue.evidence.map((item) => markdownCell(item.declaration)).join(' versus ')} | ${issue.evidence.map((item) => (item.source ? `${item.source.file}:${item.source.line}` : 'unresolved')).join('; ')} | ${issue.operationIds.length} |`
    )
    .join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'REPORT.md'),
    [
      '# Unified Model Index: Offline Structural Audit',
      '',
      `- Operations: ${summary.operationCount}; projects: ${summary.projectCount}.`,
      `- Fully consistent operations: ${summary.consistentOperations}.`,
      `- Unique model issues: ${summary.uniqueModelIssues}.`,
      `- Missing-source operations: ${summary.operationsWithMissingSources}.`,
      `- Benchmark/runtime differences: ${summary.operationsWithManifestDifferences}.`,
      `- Prompt declaration differences: ${summary.operationsWithPromptDifferences}.`,
      `- TypeScript declaration differences: ${summary.operationsWithTypedDifferences}.`,
      `- Audit exceptions: ${summary.operationsWithAuditErrors}.`,
      '- Protected inputs, prompt/rules, oracle locks and project declarations are unchanged.',
      '- No LLM calls, reference-clause analysis, Jest execution, or automatic corrections.',
      '',
      '## Model Issues',
      '',
      '| Code | Declarations | Source locations | Affected operations |',
      '| --- | --- | --- | --- |',
      issueTable || '| None | None | None | 0 |',
      '',
      'Affected operations carry the conflicting declarations in their full model context. These counts do not mean that their generated contracts failed or necessarily access those fields.',
      '',
      'The counts describe structural checks only. See operation_audit.jsonl for exact discrepancies and model_indexes.jsonl for declaration locations.',
      '',
      '## Scope',
      '',
      ...summary.limitations.map((item) => `- ${item}`),
      '',
    ].join('\n')
  );
  return summary;
};

if (require.main === module) {
  const {values} = parseArgs({
    options: {
      input: {
        type: 'string',
        default: 'data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl',
      },
      'output-dir': {type: 'string', default: 'results/model-grounding-step1-v1'},
      strict: {type: 'boolean', default: false},
    },
  });
  const summary = runModelIndexAudit(values.input!, values['output-dir']!);
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  if (values.strict && summary.consistentOperations !== summary.operationCount)
    process.exitCode = 1;
}
