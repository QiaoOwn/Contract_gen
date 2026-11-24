import {createHash} from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import * as projects from '@/rm2pt/project';
import type {UseCase} from '@/rm2pt/model/UseCase';
import {buildOperationInput, formatOperationSignature} from '@/app/service/createOperationInput';
import {formatStructuredRequirement, getBenchmarkRequirement} from '@/rm2pt/benchmarkRequirements';
import clarification from '../data/benchmark/lab_adjudicated_114_v2/requirement-clarification-decisions.json';

const root = process.cwd();
const parent = path.join(root, 'data/benchmark/lab_adjudicated_114_v1');
const target = path.join(root, 'data/benchmark/lab_adjudicated_114_v2');
const parentFile = path.join(parent, 'operations-lab-adjudicated-114-v1.jsonl');
const targetFile = path.join(target, 'operations-lab-adjudicated-114-v2.jsonl');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const decisionsFile = path.join(target, 'model-declaration-decisions.json');
const clarificationFile = path.join(target, 'requirement-clarification-decisions.json');

export const applyApprovedRequirementClarification = (row: {
  id: string;
  description: string;
  requirement_hash: string;
}) => {
  if (row.id !== clarification.operation_id) return row.description;
  if (
    row.requirement_hash !== clarification.previous_requirement_hash ||
    hash(row.description) !== row.requirement_hash
  ) {
    throw new Error('Approved clarification does not match the original BorrowBook requirement');
  }
  const structured = getBenchmarkRequirement('LibraryManagementSystem', 'borrowBook', 'borrowBook');
  const additions = clarification.additions.map((item) => item.statement);
  if (
    additions.length !== 2 ||
    additions.some((text) => structured.postconditions.filter((item) => item === text).length !== 1)
  ) {
    throw new Error('Expected exactly two approved BorrowBook postcondition clarifications');
  }
  const original = formatStructuredRequirement({
    ...structured,
    postconditions: structured.postconditions.filter((item) => !additions.includes(item)),
  });
  if (original !== row.description)
    throw new Error('Unapproved BorrowBook requirement change outside Q07/Q08');
  return formatStructuredRequirement(structured);
};

type Decision = {
  id: string;
  kind: string;
  project: string;
  use_case?: string;
  operations?: string[];
  entity?: string;
  name: string;
  previous_type: string;
  approved_type: string;
  source_evidence: {file: string; sha256: string; lines: number[]}[];
};
type ParameterDeclaration = {name: string; type: string};

export const reconcileApprovedParameters = (
  context: {
    project: string;
    useCase: string;
    operation_name: string;
    parameters: ParameterDeclaration[];
  },
  actual: ParameterDeclaration[],
  decisions: Decision[]
) => {
  if (actual.length !== context.parameters.length)
    throw new Error('Unapproved parameter count change');
  return actual.map((parameter, position) => {
    const previous = context.parameters[position];
    if (previous.name !== parameter.name) throw new Error('Unapproved parameter name/order change');
    if (previous.type !== parameter.type) {
      const matching = decisions.filter(
        (decision) =>
          decision.kind === 'parameter' &&
          decision.project === context.project &&
          decision.use_case === context.useCase &&
          decision.operations?.includes(context.operation_name) &&
          decision.name === parameter.name &&
          decision.previous_type === previous.type &&
          decision.approved_type === parameter.type
      );
      if (matching.length !== 1)
        throw new Error(
          `Unapproved parameter type change: ${context.operation_name}.${parameter.name}`
        );
    }
    return {name: parameter.name, type: parameter.type};
  });
};

async function main() {
  for (const evidence of clarification.sources) {
    const bytes = await fs.readFile(path.resolve(root, evidence.file));
    if (hash(bytes) !== evidence.sha256)
      throw new Error(`Clarification source changed: ${evidence.file}`);
    if (evidence.file.endsWith('.remodel')) {
      const lines = bytes.toString('utf8').split(/\r?\n/);
      for (const addition of clarification.additions) {
        if (!lines[addition.source_line - 1]?.includes(addition.source_text))
          throw new Error(`Missing original evidence for ${addition.obligation_id}`);
      }
    }
  }
  const adjudication = (await fs.readJson(decisionsFile)) as {
    schema_version: string;
    decisions: Decision[];
  };
  const decisions = adjudication.decisions;
  if (
    adjudication.schema_version !== 'model-declaration-adjudication-v1' ||
    decisions.length !== 3 ||
    new Set(decisions.map((decision) => decision.id)).size !== 3
  ) {
    throw new Error('Expected three approved model declaration decisions');
  }
  for (const decision of decisions) {
    for (const evidence of decision.source_evidence) {
      const file = path.resolve(root, evidence.file);
      if (!file.startsWith(path.join(root, 'data/operation_revision/upstream_rm2pt') + path.sep)) {
        throw new Error('Decision evidence is outside upstream RM2PT');
      }
      const content = await fs.readFile(file);
      const lines = content.toString('utf8').split(/\r?\n/);
      if (
        hash(content) !== evidence.sha256 ||
        evidence.lines.some((line) => !lines[line - 1]?.includes(decision.approved_type))
      ) {
        throw new Error(`Source evidence mismatch for ${decision.id}`);
      }
    }
    if (decision.kind === 'attribute') {
      const model = projects[decision.project as keyof typeof projects];
      const entity = (model.entity as Record<string, {attributes: ParameterDeclaration[]}>)[
        decision.entity!
      ];
      if (
        entity?.attributes.find((attribute) => attribute.name === decision.name)?.type !==
        decision.approved_type
      ) {
        throw new Error(`Approved attribute correction is not applied: ${decision.id}`);
      }
    }
  }
  const parentManifest = await fs.readJson(path.join(parent, 'manifest.json'));
  const parentBytes = await fs.readFile(parentFile);
  if (hash(parentBytes) !== parentManifest.output_sha256) {
    throw new Error('Parent input has changed since freezing');
  }
  const rows = parentBytes
    .toString('utf8')
    .trimEnd()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map((row) => row.id)).size !== 114) {
    throw new Error('Expected 114 unique parent operations');
  }
  const changes: {id: string; previousInputHash: string; newInputHash: string}[] = [];
  const signatureChanges: {id: string; previousSignature: string; newSignature: string}[] = [];
  const requirementChanges: {
    id: string;
    previousRequirementHash: string;
    newRequirementHash: string;
    clarificationId: string;
  }[] = [];
  let changedContextCount = 0;
  const next = rows.map((row) => {
    if (
      row.oracle_available_to_generator !== false ||
      row.input_hash !== hash(row.canonical_user_message)
    ) {
      throw new Error(`Parent input integrity failed: ${row.id}`);
    }
    const project = row.project as keyof typeof projects;
    const useCase = (projects[project].useCase as Record<string, UseCase>)[row.useCase];
    const operation = useCase.relatedService.operations.find(
      (item) => item.name === row.operation_name
    );
    if (
      !operation ||
      useCase.relatedService.name !== row.service ||
      (operation.returnType?.type || null) !== (row.return_type || null)
    ) {
      throw new Error(`Unapproved operation identity/return change: ${row.id}`);
    }
    const parameters = reconcileApprovedParameters(row, operation.parameters || [], decisions);
    if (
      formatOperationSignature({...operation, parameters: row.parameters}) !==
      row.operation_signature
    ) {
      throw new Error(`Parent signature does not match its own parameters: ${row.id}`);
    }
    const requirement = applyApprovedRequirementClarification(row);
    const input = buildOperationInput({
      project,
      useCase: row.useCase,
      operation: row.operation_name,
      userInput: requirement,
      contextStrategy: 'full',
    });
    if (input.requirement !== requirement || input.metadata.requirementHash !== hash(requirement)) {
      throw new Error(`Requirement unexpectedly changed: ${row.id}`);
    }
    if (requirement !== row.description)
      requirementChanges.push({
        id: row.id,
        previousRequirementHash: row.requirement_hash,
        newRequirementHash: input.metadata.requirementHash,
        clarificationId: clarification.id,
      });
    if (input.metadata.operationSignature !== row.operation_signature) {
      signatureChanges.push({
        id: row.id,
        previousSignature: row.operation_signature,
        newSignature: input.metadata.operationSignature,
      });
    }
    if (input.modelContext !== row.model_context) changedContextCount++;
    if (input.content !== row.canonical_user_message || input.modelContext !== row.model_context) {
      changes.push({
        id: row.id,
        previousInputHash: row.input_hash,
        newInputHash: input.metadata.inputHash,
      });
    }
    return {
      ...row,
      description: requirement,
      requirement_hash: input.metadata.requirementHash,
      ...(requirement !== row.description
        ? {
            requirement_provenance: 'researcher-approved-source-clarification',
            requirement_clarification_id: clarification.id,
          }
        : {}),
      parameters,
      operation_signature: input.metadata.operationSignature,
      model_context: input.modelContext,
      canonical_user_message: input.content,
      context_hash: input.metadata.contextHash,
      input_hash: input.metadata.inputHash,
      context_strategy: 'full',
      context_algorithm_version: input.metadata.contextAlgorithmVersion,
      input_schema_version: input.metadata.schemaVersion,
      model_grounding_enabled: input.metadata.modelGroundingEnabled,
      model_index_version: input.metadata.modelIndexVersion,
      model_grounding_rules_version: input.metadata.modelGroundingRulesVersion,
      model_grounding_rules_hash: input.metadata.modelGroundingRulesHash,
      model_grounding_rules_count: input.metadata.modelGroundingRulesCount,
      model_rule_validation_version: input.metadata.modelRuleValidationVersion,
      model_rule_repair_version: input.metadata.modelRuleRepairVersion,
      model_validation_rules_hash: input.metadata.modelValidationRulesHash,
    };
  });
  const text = next.map((row) => JSON.stringify(row)).join('\n') + '\n';
  const oracleManifest = await fs.readJson(path.join(parent, 'oracle-map-manifest.json'));
  const oracleMap = path.join(root, oracleManifest.oracle_map_file);
  if (hash(await fs.readFile(oracleMap)) !== oracleManifest.oracle_map_sha256) {
    throw new Error('Oracle map has changed since freezing');
  }
  const manifest = {
    artifact_id: 'contractgen-lab-adjudicated-114-v2',
    status: 'current-114-operation-generation-input',
    parent_file: path.relative(root, parentFile).replace(/\\/g, '/'),
    parent_file_sha256: hash(parentBytes),
    output_file: path.relative(root, targetFile).replace(/\\/g, '/'),
    output_sha256: hash(text),
    operation_count: next.length,
    context_algorithm_version: 'full-project-context-v2',
    input_schema_version: next[0].input_schema_version,
    model_grounding_enabled: true,
    model_grounding_rules_version: next[0].model_grounding_rules_version,
    model_rule_validation_version: next[0].model_rule_validation_version,
    model_rule_repair_version: next[0].model_rule_repair_version,
    changed_context_count: changedContextCount,
    changed_input_count: changes.length,
    changes,
    requirement_clarification_file: path.relative(root, clarificationFile).replace(/\\/g, '/'),
    requirement_clarification_sha256: hash(await fs.readFile(clarificationFile)),
    requirement_changes: requirementChanges,
    model_declaration_decisions_file: path.relative(root, decisionsFile).replace(/\\/g, '/'),
    model_declaration_decisions_sha256: hash(await fs.readFile(decisionsFile)),
    model_declaration_decision_count: decisions.length,
    operation_signature_changes: signatureChanges,
    oracle_map_file: oracleManifest.oracle_map_file,
    oracle_map_sha256: oracleManifest.oracle_map_sha256,
    oracle_revision: oracleManifest.oracle_revision,
    oracle_suite_lock_sha256: oracleManifest.oracle_suite_lock_sha256,
    oracle_isolation: 'Generation input contains no reference contract or Jest oracle',
  };
  await fs.ensureDir(target);
  await fs.writeFile(targetFile, text, 'utf8');
  await fs.writeJson(path.join(target, 'manifest.json'), manifest, {spaces: 2});
  process.stdout.write(
    JSON.stringify({
      rows: next.length,
      changedContexts: changedContextCount,
      approvedSignatureChanges: signatureChanges.length,
      sha256: manifest.output_sha256,
    }) + '\n'
  );
}

if (require.main === module) {
  void main().catch((error) => {
    process.stderr.write(String(error) + '\n');
    process.exitCode = 1;
  });
}
