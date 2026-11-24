import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ccHash} from '../src/app/service/crossClauseGraph';
import {read} from './lib/m4LiveAdapter';
import {assertSealed6, terminal6, inputs6, diagnostics6, verify6} from './lib/contractgenStage6';
import {evaluateStage5Public, stage5PublicSchema} from './lib/contractgenStage5';
import {structuralEvidence6} from './lib/contractgenStage6Evidence';
import {studyResultUnits, boundStudyCoverage} from './lib/narrativeStudyResults';

export async function evaluateStage6Run(directory: string, behavior = false,
  coveragePath?: string) {
  assertSealed6(directory);
  const run = read(`${directory}/run.json`);
  const identity = verify6(run.previewDirectory);
  const coverage = boundStudyCoverage(identity, coveragePath);
  const pilot: string[] = [...new Set((identity.slots as string[]).map(slot=>slot.split('__')[0]))];
  return terminal6(directory, async () => {
    const results = [];
    const units = studyResultUnits(directory, pilot);
    for (const unit of units) {
      if (!unit.candidate) {results.push({...unit, common:null, businessAssessment:'not-evaluated'}); continue;}
      const record = {id:unit.operationId,arm:unit.arm,value:unit.candidate}, {input, context} = inputs6(record.id);
      const common = await evaluateStage5Public(input, context, record.value);
      let oracle: unknown = {status: 'not-evaluated'};
      let obligationObservations: unknown[] = [];
      if (behavior && common.evaluation?.preExecValid && stage5PublicSchema.safeParse(record.value).success) {
        // Evaluation-only dynamic import after complete response seal; no generation callback exists here.
        const {loadCollaborativeOperation, validateSeededCollaborativeCandidate} = await import('../src/app/service/crossClauseOperation');
        const loaded = loadCollaborativeOperation(record.id);
        assert.equal(ccHash(loaded.input.modelGroundingContext.index), ccHash(context.index), 'Terminal model differs from public model');
        assert.equal(ccHash(loaded.input.modelGroundingContext.rules), ccHash(context.rules), 'Terminal rules differ');
        oracle = await validateSeededCollaborativeCandidate(loaded,
          {...record.value.contract, definition: record.value.contract.definition ?? ''}, [], 'gpt-5.5', 'unused-no-generation');
        const mapped = coverage.operations.find((item: {id: string}) => item.id === record.id);
        assert(mapped,'Missing bound operation coverage');
        const events = (oracle as {events?: Record<string, any>[]}).events ?? [];
        const assertions = events.flatMap(event => event['Test Result']?.result?.assertionResults ?? []);
        obligationObservations = mapped.obligations.map((obligation: any) => {
          const titles = [...new Set(obligation.assertionEvidence.flatMap((evidence: any) => evidence.scenarios.map((scenario: any) => scenario.title)))];
          const observations = assertions.filter((assertion: any) => titles.some(title => {
            const expression = String(title).split(/%[sj]/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
            return new RegExp(`^${expression}$`).test(assertion.title);
          }));
          return {key: obligation.key, sourceEvidence: obligation.sourceEvidence, coverageKind: obligation.coverageStatus,
            scenarios: observations, assessment: observations.length ? 'finite-scenario-observations' : 'not-assessed',
            failedScenarioProvesWhichAssertion: false, businessDefectLabel: 'requires-counterexample-localization'};
        });
      }
      results.push({...unit, common, structuralEvidence: structuralEvidence6(record.value, context),
        diagnostics: diagnostics6(common), oracle, obligationObservations,
        oracleFailureAutoClassifiedAsBusinessDefect: false, wholeRequirementCorrectness: 'not-proven', provisional: true});
    }
    assert.equal(results.length,15,'Fixed pilot must retain all 15 operation-arm units');
    return {results, protocolFailuresRemainInSlotOutcomes: true, provisional: true, coveragePath:identity.coveragePath};
  });
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/evaluate_contractgen_stage6.ts')) {
  const args = process.argv.slice(2);
  if (!args[0] || args.slice(1).some(value => value !== '--terminal-oracle')) throw new Error('Usage: <sealed-run-directory> [--terminal-oracle]');
  evaluateStage6Run(args[0], args.includes('--terminal-oracle')).then(value => console.log(JSON.stringify({completed: true,
    terminalResult: value}))).catch(error => {console.error(String(error)); process.exitCode = 1;});
}
