/**
 * Exports the canonical 114-operation benchmark input. Reference OCL clauses
 * are intentionally excluded so generation scripts cannot consume the oracle.
 */
import fs from 'fs-extra';
import path from 'path';
import * as allProjects from '@/rm2pt/project';
import {buildOperationInput, formatOperationSignature} from '@/app/service/createOperationInput';
import {createOCLGenerationSystemPrompt} from '@/app/service/createOCLGenerationSystemPrompt';
import type {UseCaseKeys} from '@/app/type';

const CASE_STUDY_LABEL: Record<keyof typeof allProjects, string> = {
  Airport: 'Airport',
  AutomatedTellerMachine: 'ATM',
  CoCoME: 'CoCoME',
  LibraryManagementSystem: 'Library Management',
  LoanProcessingSystem: 'Loan Processing',
};

const outPath = path.resolve(process.cwd(), 'data', 'operations.jsonl');

const main = async () => {
  const lines: string[] = [];
  const prompt = createOCLGenerationSystemPrompt();
  for (const [projectName, projectModule] of Object.entries(allProjects)) {
    const project = projectName as keyof typeof allProjects;
    for (const [useCaseName, useCaseObject] of Object.entries(projectModule.useCase)) {
      const useCase = useCaseName as UseCaseKeys;
      const relatedService = useCaseObject.relatedService;
      for (const operation of relatedService.operations) {
        const input = buildOperationInput({project, useCase, operation: operation.name});
        const parameters = (operation.parameters || []).map((parameter) => ({
          name: parameter.name,
          type: parameter.type,
        }));
        const id = [project, useCase, operation.name].join('_').replace(/\s+/g, '_');
        const oracleId = [project, relatedService.name, operation.name].join('-');
        const returnType = operation.returnType?.type || null;
        const row = {
          id,
          oracle_id: oracleId,
          requirement_group_id: input.metadata.requirementHash,
          case_study: CASE_STUDY_LABEL[project],
          project,
          useCase,
          operation: operation.name,
          service: relatedService.name,
          operation_name: operation.name,
          operation_signature: formatOperationSignature(operation),
          description: input.requirement,
          parameters,
          return_type: returnType,
          has_return_value: returnType !== null,
          model_context: input.modelContext,
          canonical_user_message: input.content,
          input_schema_version: input.metadata.schemaVersion,
          requirement_provenance: input.metadata.requirementProvenance,
          requirement_hash: input.metadata.requirementHash,
          context_hash: input.metadata.contextHash,
          input_hash: input.metadata.inputHash,
          prompt_version: prompt.version,
          prompt_hash: prompt.hash,
          generation_config_version: prompt.generationConfig.version,
          generation_config_hash: prompt.generationConfig.hash,
          generation_grammar_version: prompt.components.grammar.version,
          generation_grammar_hash: prompt.components.grammar.hash,
          generation_rules_version: prompt.components.generationRules.version,
          generation_rules_hash: prompt.components.generationRules.hash,
          generation_output_mode: prompt.generationConfig.outputMode,
          generation_temperature: prompt.generationConfig.temperature,
          generation_max_tokens: prompt.generationConfig.maxTokens,
          oracle_available_to_generator: false,
        };
        lines.push(JSON.stringify(row));
      }
    }
  }
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, lines.join('\n') + '\n', 'utf8');
  console.log('Wrote ' + lines.length + ' canonical operations to ' + outPath);
};

void main();
