import fs from 'fs-extra';
import path from 'path';
import * as allProjects from '@/rm2pt/project';
import {buildOperationInput} from '@/app/service/createOperationInput';
import {createOCLGenerationSystemPrompt} from '@/app/service/createOCLGenerationSystemPrompt';
import {listBenchmarkRequirementKeys} from '@/rm2pt/benchmarkRequirements';
import type {UseCaseKeys} from '@/app/type';

const EXPECTED_OPERATION_COUNT = 114;
const EXPECTED_ORACLE_COUNT = 107;
const EXPECTED_REQUIREMENT_COUNT = 106;
type ManifestRow = Record<string, unknown>;

const main = async () => {
  const errors: string[] = [];
  const observedKeys: string[] = [];
  const observedManifestIds = new Set<string>();
  const inputHashes = new Set<string>();
  const oracleIds = new Set<string>();
  const requirementGroupIds = new Set<string>();
  const prompt = createOCLGenerationSystemPrompt();
  const manifestPath = path.resolve(process.cwd(), 'data', 'operations.jsonl');
  const manifestRows = (await fs.readFile(manifestPath, 'utf8'))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ManifestRow);
  const manifest = new Map(manifestRows.map((row) => [String(row.id || ''), row]));
  if (manifestRows.length !== EXPECTED_OPERATION_COUNT || manifest.size !== manifestRows.length) {
    errors.push(
      'manifest must contain ' +
        EXPECTED_OPERATION_COUNT +
        ' unique rows; found ' +
        manifestRows.length
    );
  }
  for (const [projectName, projectModule] of Object.entries(allProjects)) {
    const project = projectName as keyof typeof allProjects;
    for (const [useCaseName, useCaseObject] of Object.entries(projectModule.useCase)) {
      const useCase = useCaseName as UseCaseKeys;
      for (const operation of useCaseObject.relatedService.operations) {
        const key = [project, useCase, operation.name].join('/');
        const manifestId = [project, useCase, operation.name].join('_').replace(/\s+/g, '_');
        const oracleId = [project, useCaseObject.relatedService.name, operation.name].join('-');
        const hasReturnValue = Boolean(operation.returnType?.type);
        observedKeys.push(key);
        observedManifestIds.add(manifestId);
        oracleIds.add(oracleId);
        if (!operation.name.trim()) errors.push(key + ': empty operation name');
        for (const parameter of operation.parameters || []) {
          if (!parameter.name.trim() || !parameter.type.trim()) {
            errors.push(key + ': empty parameter name or type');
          }
        }
        try {
          const input = buildOperationInput({project, useCase, operation: operation.name});
          requirementGroupIds.add(input.metadata.requirementHash);
          if (inputHashes.has(input.metadata.inputHash)) {
            errors.push(key + ': duplicate canonical input hash');
          }
          inputHashes.add(input.metadata.inputHash);
          if (/handles its intended business action/i.test(input.requirement)) {
            errors.push(key + ': generic placeholder requirement');
          }
          if (
            !input.modelContext.includes('Today: Date') ||
            !input.modelContext.includes('Now: Date')
          ) {
            errors.push(key + ': missing read-only temporal environment declarations');
          }
          const row = manifest.get(manifestId);
          if (!row) {
            errors.push(key + ': missing from operations.jsonl');
          } else {
            const checks: Array<[string, unknown, unknown]> = [
              ['canonical user message', row.canonical_user_message, input.content],
              ['oracle id', row.oracle_id, oracleId],
              ['requirement group id', row.requirement_group_id, input.metadata.requirementHash],
              ['has return value', row.has_return_value, hasReturnValue],
              ['input schema version', row.input_schema_version, input.metadata.schemaVersion],
              ['requirement hash', row.requirement_hash, input.metadata.requirementHash],
              ['context hash', row.context_hash, input.metadata.contextHash],
              ['input hash', row.input_hash, input.metadata.inputHash],
              ['prompt version', row.prompt_version, prompt.version],
              ['prompt hash', row.prompt_hash, prompt.hash],
              [
                'generation config version',
                row.generation_config_version,
                prompt.generationConfig.version,
              ],
              ['generation config hash', row.generation_config_hash, prompt.generationConfig.hash],
              [
                'generation output mode',
                row.generation_output_mode,
                prompt.generationConfig.outputMode,
              ],
              [
                'generation temperature',
                row.generation_temperature,
                prompt.generationConfig.temperature,
              ],
              [
                'generation max tokens',
                row.generation_max_tokens,
                prompt.generationConfig.maxTokens,
              ],
              ['oracle isolation', row.oracle_available_to_generator, false],
            ];
            for (const [name, actual, expected] of checks) {
              if (actual !== expected) {
                errors.push(
                  key +
                    ': stale ' +
                    name +
                    ' (manifest=' +
                    String(actual) +
                    ', runtime=' +
                    String(expected) +
                    ')'
                );
              }
            }
          }
        } catch (error) {
          errors.push(key + ': ' + (error as Error).message);
        }
      }
    }
  }

  const observed = observedKeys.sort();
  const catalog = listBenchmarkRequirementKeys();
  const observedSet = new Set(observed);
  const catalogSet = new Set(catalog);
  for (const key of observed) {
    if (!catalogSet.has(key)) errors.push(key + ': missing from requirement catalog');
  }
  for (const key of catalog) {
    if (!observedSet.has(key)) errors.push(key + ': requirement has no matching operation');
  }
  if (observed.length !== EXPECTED_OPERATION_COUNT) {
    errors.push(
      'expected ' + EXPECTED_OPERATION_COUNT + ' operations but found ' + observed.length
    );
  }
  if (oracleIds.size !== EXPECTED_ORACLE_COUNT) {
    errors.push(
      'expected ' +
        EXPECTED_ORACLE_COUNT +
        ' distinct service-operation oracles but found ' +
        oracleIds.size
    );
  }
  if (requirementGroupIds.size !== EXPECTED_REQUIREMENT_COUNT) {
    errors.push(
      'expected ' +
        EXPECTED_REQUIREMENT_COUNT +
        ' distinct requirement specifications but found ' +
        requirementGroupIds.size
    );
  }
  for (const oracleId of oracleIds) {
    const oraclePath = path.resolve(process.cwd(), 'test', oracleId, 'index.test.ts');
    if (!(await fs.pathExists(oraclePath))) {
      errors.push(oracleId + ': missing operation-level Jest oracle');
    }
  }
  for (const id of manifest.keys()) {
    if (!observedManifestIds.has(id)) errors.push(id + ': manifest row has no matching operation');
  }
  if (prompt.text.includes('allInstance()')) {
    errors.push('generation prompt exposes unsupported singular allInstance()');
  }
  if (prompt.text.includes('ruleUC') || prompt.text.includes('ruleInteraction')) {
    errors.push('generation prompt contains unrelated REMODEL grammar');
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(
    'Validated ' +
      observed.length +
      ' structured requirements, ' +
      inputHashes.size +
      ' unique operation-context inputs, ' +
      oracleIds.size +
      ' distinct service operations, ' +
      requirementGroupIds.size +
      ' distinct requirement specifications, prompt ' +
      prompt.version +
      ' (' +
      prompt.hash +
      ').'
  );
};

void main();
