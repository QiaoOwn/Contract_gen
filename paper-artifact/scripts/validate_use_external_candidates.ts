import fs from 'fs-extra';
import path from 'path';
import {Parameter} from '../src/rm2pt/model/Parameter';
import {generateContractCode, parse} from '../src/app/util';
import {validateGeneratedContractSemantics} from '../src/app/service/validateGeneratedContractSemantics';
import {
  checkExternalCandidateEntry,
  createExternalCandidateEntryCode,
  parseExternalOperationSignature,
  type ExternalGenerationInput,
} from '../data/benchmark/external/use-operation-candidates-v2/evaluation/runtime/generatedCandidateAdapter';

type Candidate = Readonly<{
  operation_id: string;
  model?: string;
  attempt?: number;
  definition?: string | null;
  precondition: string;
  postcondition: string;
}>;

const root = process.cwd();
const benchmarkDir = path.resolve(
  root,
  'data/benchmark/external/use-operation-candidates-v2'
);

const argument = (name: string, fallback = '') => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const candidatePath = path.resolve(root, argument('--candidates'));
const outputDir = path.resolve(
  root,
  argument(
    '--output-dir',
    'results/contractgen-lab-adjudicated-114-v2/validation/use_external_candidate_preexec'
  )
);

if (!argument('--candidates')) {
  throw new Error('Missing required --candidates <jsonl>');
}

const readJsonl = <T,>(file: string): T[] =>
  fs
    .readFileSync(file, 'utf-8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as T;
      } catch (error) {
        throw new Error(`${file}:${index + 1}: ${String(error)}`);
      }
    });

const inputs = new Map<string, ExternalGenerationInput>(
  readJsonl<ExternalGenerationInput>(path.resolve(benchmarkDir, 'generation-inputs.jsonl')).map(
    (row) => [row.id, row]
  )
);

const compactError = (error: unknown) =>
  (error instanceof Error ? error.stack || error.message : String(error)).slice(0, 4000);

const serviceName = (contextType: string) => `External${contextType}ContractContext`;

const validateCandidate = async (candidate: Candidate) => {
  const input = inputs.get(candidate.operation_id);
  if (!input) {
    return {
      ...candidate,
      contract_parse_valid: false,
      lowering_valid: false,
      typescript_static_valid: false,
      preexec_valid: false,
      failure_stage: 'metadata',
      diagnostics: [{line: 0, column: 0, msg: 'Unknown external operation ID'}],
    };
  }
  const signature = parseExternalOperationSignature(input.operation_signature);
  const clauses = {
    definition: candidate.definition || undefined,
    precondition: candidate.precondition,
    postcondition: candidate.postcondition,
  };
  const contract = generateContractCode({
    serviceName: serviceName(signature.contextType),
    operationName: signature.operationName,
    parameters: signature.parameters.map((parameter) => new Parameter(parameter)),
    returnedType: signature.returnType,
    ...clauses,
  });
  const parsed = parse(contract);
  const parserDiagnostics = parsed.errors.map((diagnostic) => ({...diagnostic, code: 0}));
  const semanticDiagnostics =
    parserDiagnostics.length === 0 && parsed.tree
      ? validateGeneratedContractSemantics({
          tree: parsed.tree,
          hasReturnValue: Boolean(signature.returnType),
        }).map((diagnostic) => ({...diagnostic, code: 0}))
      : [];
  const contractDiagnostics = [...parserDiagnostics, ...semanticDiagnostics];
  if (contractDiagnostics.length > 0) {
    return {
      ...candidate,
      contract_parse_valid: false,
      lowering_valid: false,
      typescript_static_valid: false,
      preexec_valid: false,
      failure_stage: 'contract_validation',
      diagnostics: contractDiagnostics,
      contract,
    };
  }
  try {
    const generated = await createExternalCandidateEntryCode(input, clauses);
    const typescriptDiagnostics = checkExternalCandidateEntry(generated.entry);
    return {
      ...candidate,
      contract_parse_valid: true,
      lowering_valid: true,
      typescript_static_valid: typescriptDiagnostics.length === 0,
      preexec_valid: typescriptDiagnostics.length === 0,
      failure_stage: typescriptDiagnostics.length === 0 ? '' : 'typescript_static',
      diagnostics: typescriptDiagnostics,
      contract,
      generated_service_name: generated.serviceName,
      lowering_counter: generated.counter,
    };
  } catch (error) {
    return {
      ...candidate,
      contract_parse_valid: true,
      lowering_valid: false,
      typescript_static_valid: false,
      preexec_valid: false,
      failure_stage: 'lowering',
      diagnostics: [{line: 0, column: 0, code: 0, msg: compactError(error)}],
      contract,
    };
  }
};

const main = async () => {
  const candidates = readJsonl<Candidate>(candidatePath);
  const duplicateIds = candidates
    .map((row) => row.operation_id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate candidate operation IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  }
  const results = [];
  for (const candidate of candidates) results.push(await validateCandidate(candidate));
  fs.ensureDirSync(outputDir);
  fs.writeFileSync(
    path.resolve(outputDir, 'candidate-results.jsonl'),
    `${results.map((row) => JSON.stringify(row)).join('\n')}\n`
  );
  const preexec = results.filter((row) => row.preexec_valid).length;
  const summary = {
    schema_version: 'contractgen-use-external-candidate-preexec-v1',
    candidate_source: path.relative(root, candidatePath).split(path.sep).join('/'),
    candidates_total: results.length,
    contract_parse_valid: results.filter((row) => row.contract_parse_valid).length,
    lowering_valid: results.filter((row) => row.lowering_valid).length,
    typescript_static_valid: results.filter((row) => row.typescript_static_valid).length,
    preexec_valid: preexec,
    failure_stage_counts: results.reduce<Record<string, number>>((counts, row) => {
      const stage = row.failure_stage || 'preexec_valid';
      counts[stage] = (counts[stage] || 0) + 1;
      return counts;
    }, {}),
    llm_calls: 0,
    hidden_oracle_executed: false,
    claim_boundary:
      'This run measures external candidate PreExec compatibility only; it does not report hidden-scenario acceptance.',
  };
  fs.writeJSONSync(path.resolve(outputDir, 'summary.json'), summary, {spaces: 2});
  process.stdout.write(`${JSON.stringify(summary)}\n`);
};

main().catch((error) => {
  console.error(compactError(error));
  process.exitCode = 1;
});
