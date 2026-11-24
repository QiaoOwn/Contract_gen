import type {DevelopmentBehaviorReport, DevelopmentDiagnostic, DevelopmentObligation} from './types';

export type FiniteObservation = {obligationId: string; passed: boolean; expected: unknown; observed: unknown};
export type PreparedScenario = {
  invoke: () => unknown;
  observe: (result: unknown) => FiniteObservation[];
  observePrecondition?: (id: string) => {satisfied: boolean; expected: unknown; observed: unknown};
  observeAfterPostcheckFailure?: () => FiniteObservation[];
};
export type FiniteScenario = {id: string; obligationIds: string[]; rejectObligation?: string};

// Execution failures remain unresolved unless an explicit scenario obligation explains them.
export function runFiniteScenarios(
  specification: {id: string; schemaVersion: string; obligations: DevelopmentObligation[]},
  scenarios: FiniteScenario[],
  prepare: (scenario: FiniteScenario) => PreparedScenario
): DevelopmentBehaviorReport {
  const checks: DevelopmentBehaviorReport['checks'] = [];
  const diagnostics: DevelopmentDiagnostic[] = [];
  const executionObservations: DevelopmentBehaviorReport['executionObservations'] = [];
  for (const scenario of scenarios) {
    const prepared = prepare(scenario);
    const rejectedObligation = specification.obligations.find(item => item.id === scenario.rejectObligation &&
      item.clause === 'precondition' && scenario.obligationIds.includes(item.id) &&
      item.requirement.trim() && item.documentLine > 0 && item.modelFeatures.length > 0 &&
      item.modelLines[0] > 0 && item.modelLines[1] >= item.modelLines[0]);
    // Capture independent evidence before candidate code can change the scenario state.
    const precondition = rejectedObligation && prepared.observePrecondition
      ? structuredClone(prepared.observePrecondition(rejectedObligation.id)) : undefined;
    const admission = !scenario.rejectObligation && prepared.observePrecondition
      ? specification.obligations.filter(o=>o.clause==='precondition'&&scenario.obligationIds.includes(o.id))
        .map(o=>({obligationId:o.id,...structuredClone(prepared.observePrecondition!(o.id))})) : [];
    const admissionEvidence=admission.length>0&&admission.every(o=>o.satisfied===true)
      ? {basis:'independent-source-precondition-observation',timing:'before-invocation',allSatisfied:true,obligationIds:admission.map(o=>o.obligationId),observations:admission} : null;
    let result: unknown;
    let failure: {name: string; message: string; oclOrigin?:unknown} | undefined;
    try { result = prepared.invoke(); } catch (error) {
      failure = error instanceof Error ? {name: error.name, message: error.message,...('oclOrigin' in error?{oclOrigin:error.oclOrigin}:{})}
        : {name: 'Error', message: String(error)};
    }
    const unresolvedDefinition = failure?.name === 'PreconditionError' &&
      failure.message.includes('definition binding could not be evaluated');
    const explicitRejection = failure?.name === 'PreconditionError' && !unresolvedDefinition;
    if (failure) {
      if (unresolvedDefinition && precondition?.satisfied === false && rejectedObligation) {
        executionObservations.push({scenarioId: scenario.id, classification: 'definition-failure-unresolved',
          conventionStatus: 'matched', rejectionEvidence: {obligationId: rejectedObligation.id,
            preconditionSatisfied: false, basis: 'independent-source-precondition-observation', rootCauseEstablished: false,
            expected: precondition.expected, observed: precondition.observed}});
        checks.push({scenarioId: scenario.id, obligationId: rejectedObligation.id, passed: true,
          expected: 'reject an independently confirmed inadmissible input', observed: {failure, precondition}});
        continue;
      }
      if ((failure.name === 'PostconditionError'||(failure.oclOrigin as {clause?:string;phase?:string}|undefined)?.clause==='postcondition'&&
        (failure.oclOrigin as {phase?:string}).phase==='effect'&&admissionEvidence) && !scenario.rejectObligation && prepared.observeAfterPostcheckFailure) {
        const observations = prepared.observeAfterPostcheckFailure();
        if (!Array.isArray(observations) || new Set(observations.map(item => item.obligationId)).size !== observations.length ||
            observations.some(item => !scenario.obligationIds.includes(item.obligationId) ||
              !specification.obligations.some(obligation => obligation.id === item.obligationId &&
                obligation.clause === 'postcondition' && !obligation.modelFeatures.includes('$result'))))
          throw new Error(`Postcheck state observations must be unique registered non-result obligations: ${scenario.id}`);
        const mismatches = observations.filter(item => item.passed === false);
        if (mismatches.length) {
          executionObservations.push({scenarioId: scenario.id, classification: 'postcondition-check-failure', conventionStatus: 'matched'});
          for (const observation of mismatches) {
            checks.push({scenarioId: scenario.id, ...observation});
            diagnostics.push({kind: 'development-behavior', scenarioId: scenario.id, code: 'OBLIGATION_MISMATCH',
              obligationIds: [observation.obligationId], expected: observation.expected,
              observed: {stateObservation: observation.observed, failure},
              message: `${specification.obligations.find(item => item.id === observation.obligationId)!.requirement} Independent state observation after PostCheck rejection; the exception alone does not establish the root cause.`});
          }
          continue;
        }
      }
      executionObservations.push({scenarioId: scenario.id,
        classification: unresolvedDefinition ? 'definition-failure-unresolved' : explicitRejection ? 'explicit-rejection' : 'runtime-error',
        conventionStatus: unresolvedDefinition ? 'inconclusive' : explicitRejection ? 'matched' : 'mismatched'});
      if (scenario.rejectObligation && explicitRejection) {
        checks.push({scenarioId: scenario.id, obligationId: scenario.rejectObligation,
          passed: true, expected: 'explicit rejection', observed: 'PreconditionError'});
      } else diagnostics.push({kind: 'development-behavior', scenarioId: scenario.id,
        code: unresolvedDefinition&&admissionEvidence ? 'UNEXPECTED_REJECTION' : unresolvedDefinition ? 'REJECTION_UNRESOLVED' : explicitRejection ? 'UNEXPECTED_REJECTION' : 'EXECUTION_ERROR',
        obligationIds: (explicitRejection||unresolvedDefinition&&admissionEvidence) && !scenario.rejectObligation
          ? scenario.obligationIds.filter(id => id.startsWith('P')) : [],
        expected: scenario.rejectObligation ? 'explicit rejection' : 'successful invocation', observed: {...failure,...(admissionEvidence?{admissibilityEvidence:admissionEvidence}:{})},
        message: 'Observed execution outcome; a runtime exception does not establish a business root cause.'});
      continue;
    }
    if (scenario.rejectObligation) {
      executionObservations.push({scenarioId: scenario.id, classification: 'return-without-rejection-signal', conventionStatus: 'mismatched'});
      if (rejectedObligation && precondition?.satisfied === false) {
        const expected = {requirement: rejectedObligation.requirement, outcome: 'explicit rejection'};
        const observed = {outcome: 'normal return', resultType: result == null ? null : typeof result,
          preconditionEvidence: {basis: 'independent-source-precondition-observation', timing: 'before-invocation', ...precondition}};
        checks.push({scenarioId: scenario.id, obligationId: rejectedObligation.id, passed: false, expected, observed});
        diagnostics.push({kind: 'development-behavior', scenarioId: scenario.id, code: 'OBLIGATION_MISMATCH',
          obligationIds: [rejectedObligation.id], expected, observed,
          message: `${rejectedObligation.requirement} Independent pre-invocation observation confirms an inadmissible input, but the candidate returned normally instead of rejecting it.`});
      } else diagnostics.push({kind: 'development-behavior', scenarioId: scenario.id, code: 'REJECTION_UNRESOLVED',
          obligationIds: [], expected: 'explicit rejection', observed: result == null ? null : typeof result,
          message: 'Normal return without independent inadmissibility evidence does not establish a source-backed precondition mismatch.'});
      continue;
    }
    executionObservations.push({scenarioId: scenario.id, classification: 'completed', conventionStatus: 'matched'});
    const observations = prepared.observe(result);
    if (observations.length !== scenario.obligationIds.length ||
        new Set(observations.map(item => item.obligationId)).size !== observations.length ||
        scenario.obligationIds.some(id => !observations.some(item => item.obligationId === id)))
      throw new Error(`Incomplete scenario observation plan: ${scenario.id}`);
    for (const observation of observations) {
      checks.push({scenarioId: scenario.id, ...observation});
      if (!observation.passed) diagnostics.push({kind: 'development-behavior', scenarioId: scenario.id,
        code: 'OBLIGATION_MISMATCH', obligationIds: [observation.obligationId], expected: observation.expected,
        observed: observation.observed,
        message: specification.obligations.find(item => item.id === observation.obligationId)!.requirement});
    }
  }
  const businessStatus = diagnostics.some(item => ['OBLIGATION_MISMATCH', 'UNEXPECTED_REJECTION'].includes(item.code))
    ? 'mismatched' : diagnostics.length ? 'inconclusive' : 'matched';
  const executionConventionStatus = executionObservations.some(item => item.conventionStatus === 'mismatched')
    ? 'mismatched' : executionObservations.some(item => item.conventionStatus === 'inconclusive') ? 'inconclusive' : 'matched';
  const observed = new Set(checks.filter(item => item.passed !== null).map(item => item.obligationId));
  const unobservedObligationIds = specification.obligations.filter(item => !observed.has(item.id)).map(item => item.id);
  return {schemaVersion: specification.schemaVersion, operationId: specification.id, role: 'development_only',
    reviewStatus: 'pending-user-review', hiddenEvaluationUsed: false, dynamicRepairEnabled: false,
    coverageScope: 'finite-development-scenarios',
    businessAssessmentBasis: 'cited-upstream-operation-specification-and-aligned-current-input',
    businessStatus, executionConventionStatus, executionObservations, checks, diagnostics, unobservedObligationIds,
    scenarioCount: scenarios.length, scenarioResults: scenarios.map(scenario => ({id: scenario.id,
      passed: !diagnostics.some(item => item.scenarioId === scenario.id),
      checkCount: checks.filter(item => item.scenarioId === scenario.id).length})),
    passed: businessStatus === 'matched' && executionConventionStatus === 'matched' && !unobservedObligationIds.length};
}
