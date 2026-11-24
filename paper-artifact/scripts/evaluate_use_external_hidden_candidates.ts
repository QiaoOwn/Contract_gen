import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import {pathToFileURL} from 'url';
import {Parameter} from '../src/rm2pt/model/Parameter';
import {createGlobalEntryCode} from '../src/app/service/createGlobalEntryCode';
import {validateGeneratedContractSemantics} from '../src/app/service/validateGeneratedContractSemantics';
import {generateContractCode, parse} from '../src/app/util';
import {
  checkExternalCandidateEntry,
  createExternalCandidateEntryCode,
  parseExternalOperationSignature,
  type ExternalGenerationInput,
} from '../data/benchmark/external/use-operation-candidates-v2/evaluation/runtime/generatedCandidateAdapter';
import {
  externalHiddenOracleCoverage,
  getExternalHiddenScenarios,
  resetExternalCandidateRuntime,
} from '../data/benchmark/external/use-operation-candidates-v2/evaluation/runtime/generatedCandidateOracle';

type Candidate = Readonly<{
  operation_id?: string;
  id?: string;
  model?: string;
  attempt?: number;
  definition?: string | null;
  precondition: string;
  postcondition: string;
}>;

type ScenarioManifestRow = Readonly<{
  id: string;
  scenarios: readonly Readonly<{id: string; kind: string}>[];
}>;

const root = process.cwd();
const benchmarkDir = path.resolve(root, 'data/benchmark/external/use-operation-candidates-v2');

const argument = (name: string, fallback = '') => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const candidateArgument = argument('--candidates');
if (!candidateArgument) throw new Error('Missing required --candidates <jsonl>');
const candidatePath = path.resolve(root, candidateArgument);
const outputDir = path.resolve(
  root,
  argument(
    '--output-dir',
    'results/contractgen-lab-adjudicated-114-v2/validation/use_external_hidden_candidates'
  )
);
const temporaryRoot = path.resolve(root, 'test/tmp/use-external-hidden-candidates');

const readJsonl = <T>(file: string): T[] =>
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
const scenarioManifest = new Map<string, ScenarioManifestRow>(
  readJsonl<ScenarioManifestRow>(
    path.resolve(benchmarkDir, 'evaluation/scenario-manifest.jsonl')
  ).map((row) => [row.id, row])
);

const compactError = (error: unknown) =>
  (error instanceof Error ? error.stack || error.message : String(error)).slice(0, 4000);

const sha256 = (file: string) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const candidateId = (candidate: Candidate) => candidate.operation_id || candidate.id || '';

const coveredObligations = (operationId: string, scenarioId: string): string[] => {
  const manifest = scenarioManifest.get(operationId);
  if (!manifest) throw new Error(`Missing frozen scenario manifest for ${operationId}`);
  if (scenarioId === 'reference_behavior') {
    return manifest.scenarios
      .filter(
        (scenario) => scenario.kind === 'positive' || scenario.kind === 'negative_postcondition'
      )
      .map((scenario) => scenario.id);
  }
  return manifest.scenarios.some((scenario) => scenario.id === scenarioId) ? [scenarioId] : [];
};

const validateContract = (input: ExternalGenerationInput, candidate: Candidate) => {
  const signature = parseExternalOperationSignature(input.operation_signature);
  const contract = generateContractCode({
    serviceName: `External${signature.contextType}ContractContext`,
    operationName: signature.operationName,
    parameters: signature.parameters.map((parameter) => new Parameter(parameter)),
    returnedType: signature.returnType,
    definition: candidate.definition || undefined,
    precondition: candidate.precondition,
    postcondition: candidate.postcondition,
  });
  const parsed = parse(contract);
  const diagnostics = [...parsed.errors];
  if (parsed.tree && diagnostics.length === 0) {
    diagnostics.push(
      ...validateGeneratedContractSemantics({
        tree: parsed.tree,
        hasReturnValue: Boolean(signature.returnType),
      })
    );
  }
  return {contract, diagnostics};
};

const main = async () => {
  const candidates = readJsonl<Candidate>(candidatePath);
  const ids = candidates.map(candidateId);
  const missingIds = ids.filter((id) => !id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (missingIds.length > 0) throw new Error('Each candidate must contain operation_id or id');
  if (duplicates.length > 0) {
    throw new Error(`Duplicate candidate operation IDs: ${[...new Set(duplicates)].join(', ')}`);
  }

  const oracleCoverage = externalHiddenOracleCoverage();
  const benchmarkIds = [...inputs.keys()];
  const mappedIds = new Set(oracleCoverage.map((row) => row.operation_id));
  const unmapped = benchmarkIds.filter((id) => !mappedIds.has(id));
  if (unmapped.length > 0)
    throw new Error(`Missing hidden oracle mappings: ${unmapped.join(', ')}`);
  const manifestObligations = [...scenarioManifest.values()].flatMap((row) =>
    row.scenarios.map((scenario) => `${row.id}::${scenario.id}`)
  );
  const coveredManifestObligations = oracleCoverage.flatMap((row) =>
    getExternalHiddenScenarios(row.operation_id).flatMap((scenario) =>
      coveredObligations(row.operation_id, scenario.id).map(
        (obligation) => `${row.operation_id}::${obligation}`
      )
    )
  );
  const coveredSet = new Set(coveredManifestObligations);
  const uncoveredObligations = manifestObligations.filter(
    (obligation) => !coveredSet.has(obligation)
  );
  if (uncoveredObligations.length > 0) {
    throw new Error(`Uncovered frozen oracle obligations: ${uncoveredObligations.join(', ')}`);
  }

  const expectedParent = path.resolve(root, 'test/tmp');
  if (!temporaryRoot.startsWith(`${expectedParent}${path.sep}`)) {
    throw new Error(`Refusing to reset unexpected temporary directory: ${temporaryRoot}`);
  }
  fs.removeSync(temporaryRoot);
  fs.ensureDirSync(temporaryRoot);
  fs.writeFileSync(path.resolve(temporaryRoot, 'globalEntry.ts'), createGlobalEntryCode());

  const candidateResults: Record<string, unknown>[] = [];
  const scenarioResults: Record<string, unknown>[] = [];
  for (const candidate of candidates) {
    const operationId = candidateId(candidate);
    const input = inputs.get(operationId);
    if (!input) {
      candidateResults.push({
        operation_id: operationId,
        status: 'METADATA_ERROR',
        preexec_valid: false,
        hidden_scenarios_passed: 0,
        hidden_scenarios_total: 0,
        error: 'Unknown operation ID',
      });
      continue;
    }
    const {contract, diagnostics: contractDiagnostics} = validateContract(input, candidate);
    if (contractDiagnostics.length > 0) {
      candidateResults.push({
        operation_id: operationId,
        model: candidate.model || '',
        attempt: candidate.attempt || null,
        status: 'PREEXEC_CONTRACT_VALIDATION_FAILED',
        preexec_valid: false,
        hidden_scenarios_passed: 0,
        hidden_scenarios_total: 0,
        diagnostics: contractDiagnostics,
        contract,
      });
      continue;
    }
    const caseDir = path.resolve(temporaryRoot, operationId);
    fs.ensureDirSync(caseDir);
    const entryPath = path.resolve(caseDir, 'entry.ts');
    try {
      const generated = await createExternalCandidateEntryCode(input, {
        definition: candidate.definition || undefined,
        precondition: candidate.precondition,
        postcondition: candidate.postcondition,
      });
      const staticDiagnostics = checkExternalCandidateEntry(generated.entry);
      if (staticDiagnostics.length > 0) {
        candidateResults.push({
          operation_id: operationId,
          model: candidate.model || '',
          attempt: candidate.attempt || null,
          status: 'PREEXEC_TYPESCRIPT_STATIC_FAILED',
          preexec_valid: false,
          hidden_scenarios_passed: 0,
          hidden_scenarios_total: 0,
          diagnostics: staticDiagnostics,
          contract,
        });
        continue;
      }
      fs.writeFileSync(entryPath, generated.entry);
      const runtime = (await import(`${pathToFileURL(entryPath).href}?t=${Date.now()}`)) as Record<
        string,
        any
      >;
      const mappedScenarios = getExternalHiddenScenarios(operationId);
      let passed = 0;
      for (const scenario of mappedScenarios) {
        resetExternalCandidateRuntime(runtime);
        const obligationIds = coveredObligations(operationId, scenario.id);
        try {
          scenario.run(runtime, generated.serviceName);
          passed += 1;
          scenarioResults.push({
            operation_id: operationId,
            scenario_id: scenario.id,
            kind: scenario.kind,
            covered_obligation_ids: obligationIds,
            status: 'PASS',
            error: '',
          });
        } catch (error) {
          scenarioResults.push({
            operation_id: operationId,
            scenario_id: scenario.id,
            kind: scenario.kind,
            covered_obligation_ids: obligationIds,
            status: 'FAIL',
            error: compactError(error),
          });
        }
      }
      candidateResults.push({
        operation_id: operationId,
        model: candidate.model || '',
        attempt: candidate.attempt || null,
        status: passed === mappedScenarios.length ? 'HIDDEN_ACCEPTED' : 'HIDDEN_REJECTED',
        preexec_valid: true,
        hidden_scenarios_passed: passed,
        hidden_scenarios_total: mappedScenarios.length,
        generated_entry_sha256: sha256(entryPath),
        contract,
      });
    } catch (error) {
      candidateResults.push({
        operation_id: operationId,
        model: candidate.model || '',
        attempt: candidate.attempt || null,
        status: 'PREEXEC_LOWERING_FAILED',
        preexec_valid: false,
        hidden_scenarios_passed: 0,
        hidden_scenarios_total: 0,
        error: compactError(error),
        contract,
      });
    }
  }

  fs.ensureDirSync(outputDir);
  fs.writeFileSync(
    path.resolve(outputDir, 'candidate-results.jsonl'),
    `${candidateResults.map((row) => JSON.stringify(row)).join('\n')}\n`
  );
  fs.writeFileSync(
    path.resolve(outputDir, 'scenario-results.jsonl'),
    `${scenarioResults.map((row) => JSON.stringify(row)).join('\n')}\n`
  );
  fs.writeJSONSync(path.resolve(outputDir, 'oracle-coverage.json'), oracleCoverage, {spaces: 2});

  const accepted = candidateResults.filter((row) => row.status === 'HIDDEN_ACCEPTED').length;
  const rejected = candidateResults.filter((row) => row.status === 'HIDDEN_REJECTED').length;
  const preexecFailed = candidateResults.length - accepted - rejected;
  const summary = {
    schema_version: 'contractgen-use-external-hidden-evaluation-v1',
    candidate_source: path.relative(root, candidatePath).split(path.sep).join('/'),
    candidates_total: candidateResults.length,
    preexec_valid: accepted + rejected,
    preexec_failed: preexecFailed,
    hidden_accepted: accepted,
    hidden_rejected: rejected,
    hidden_scenarios_total: scenarioResults.length,
    hidden_scenarios_passed: scenarioResults.filter((row) => row.status === 'PASS').length,
    oracle_operations_mapped: oracleCoverage.length,
    oracle_execution_scenarios_mapped: oracleCoverage.reduce((sum, row) => sum + row.scenarios, 0),
    oracle_manifest_obligations_mapped: coveredSet.size,
    oracle_manifest_obligations_total: manifestObligations.length,
    llm_calls: 0,
    reference_contracts_available_to_candidates: false,
    hidden_scenarios_available_to_candidates: false,
    claim_boundary:
      'Only candidates supplied in --candidates are evaluated. PreExec incompatibility, hidden behavioral rejection, and acceptance are reported separately.',
  };
  fs.writeJSONSync(path.resolve(outputDir, 'summary.json'), summary, {spaces: 2});
  fs.writeFileSync(
    path.resolve(outputDir, 'REPORT.md'),
    [
      '# USE External Generated-Candidate Hidden Evaluation v1',
      '',
      `- Candidate input: \`${summary.candidate_source}\``,
      `- Candidates: ${summary.candidates_total}`,
      `- PreExec valid: ${summary.preexec_valid}`,
      `- PreExec failed: ${summary.preexec_failed}`,
      `- Hidden accepted: ${summary.hidden_accepted}`,
      `- Hidden rejected: ${summary.hidden_rejected}`,
      `- Hidden scenarios passed: ${summary.hidden_scenarios_passed}/${summary.hidden_scenarios_total}`,
      `- Oracle execution mappings: ${summary.oracle_operations_mapped} operations, ${summary.oracle_execution_scenarios_mapped} independent runs`,
      `- Frozen atomic obligations covered: ${summary.oracle_manifest_obligations_mapped}/${summary.oracle_manifest_obligations_total}`,
      '- Oracle leakage to candidates: none',
      '- LLM calls in this evaluator: 0',
      '',
      summary.claim_boundary,
      '',
    ].join('\n')
  );
  process.stdout.write(`${JSON.stringify(summary)}\n`);
};

main().catch((error) => {
  console.error(compactError(error));
  process.exitCode = 1;
});
