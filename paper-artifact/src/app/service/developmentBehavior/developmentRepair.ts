import fs from 'node:fs';
import {createHash} from 'node:crypto';
import protocol from '../../../../config/development-repair-protocol.json';
import type {OperationModelGrounding} from '../operationModelGrounding';
import type {RepairDiagnostic} from '../repairDiagnostics';
import type {ModelIndex} from '../modelIndex';
import {
  classifyRepairDiagnostic,
  isCandidateRepair,
  nonCandidateRepairPolicy,
  REPAIR_TAXONOMY_VERSION,
} from '../repairTaxonomy';
import {developmentRegistry, DEVELOPMENT_REGISTRY_VERSION} from './registry';
import type {DevelopmentBehaviorReport} from './types';
import {analyzeRepairCandidate, localizeBehaviorRepair} from '../repairLocalization';
import {obligationKinds} from './obligationKinds';
import {modelDeclarations} from '../modelDeclarations';
export type {DevelopmentBehaviorReport} from './types';

const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const implementationFingerprint = hash(
  JSON.stringify({
    version: protocol.version,
    files: protocol.files.map((file) => ({file, sha256: hash(fs.readFileSync(file))})),
  })
);
export const createRepairProtocol = (enabled = false) => ({
  version: enabled ? protocol.version : 'static-feedback-only',
  diagnosticPolicyVersion: REPAIR_TAXONOMY_VERSION,
  developmentRegistryVersion: DEVELOPMENT_REGISTRY_VERSION,
  developmentBehaviorEnabled: enabled,
  fingerprint: enabled ? implementationFingerprint : null,
  implementationFingerprint,
  stoppingRule: enabled
    ? 'first-preexecution-and-development-pass-or-unresolved-development-or-shared-budget-exhaustion'
    : 'first-preexecution-pass-or-shared-budget-exhaustion',
  budgetUnit: 'llm-generation',
  hiddenEvaluationFeedback: false,
});
export type RepairProtocol = ReturnType<typeof createRepairProtocol>;

export const developmentModelDeclarations = (index: ModelIndex) => {
  const declarations=modelDeclarations(index);
  return [...declarations,...index.enumerations.filter(e=>!e.conflicting).flatMap(e=>
    [...new Set(e.declarations.flatMap(d=>d.literals))].flatMap(literal=>{
      const owner=e.declarations.find(d=>d.literals.includes(literal)&&declarations.some(m=>m.id===d.elementId&&m.source));
      const source=declarations.find(m=>m.id===owner?.elementId)?.source;
      return source?[{name:`${e.name}.${literal}`,id:`${e.id}/literal/${literal}`,declaration:`${e.name}::${literal}`,source}]:[];
    }))];
};

export function developmentRepairDiagnostics(
  report: DevelopmentBehaviorReport,
  context: OperationModelGrounding,
  ocl: {definition: string; precondition: string; postcondition: string}
): RepairDiagnostic[] {
  const {index} = context;
  const registration = developmentRegistry.require({
    project: index.project,
    useCase: index.useCase,
    operation: index.operation.name,
  });
  if (report.operationId !== registration.id)
    throw new Error('Development diagnostic operation does not match the model context');
  const elements = developmentModelDeclarations(index);
  const analysis = report.diagnostics.length ? analyzeRepairCandidate(ocl, context) : null;
  return report.diagnostics.map((diagnostic) => {
    const obligations = diagnostic.obligationIds
      .map((id) => registration.obligations.find((item) => item.id === id)!)
      .filter(Boolean);
    const features = new Set(obligations.flatMap((item) => item.modelFeatures));
    const modelEvidence = elements
      .filter((element) => features.has(element.name))
      .map(({id, declaration, source}) => ({id, declaration, source}));
    const classification = classifyRepairDiagnostic('development', diagnostic.code, {
      requirementObligation:
        obligations.length > 0 &&
        obligations.length === diagnostic.obligationIds.length &&
        [...features].every((name) =>
          elements.some((item) => item.name === name && item.source !== null)
        ) &&
        obligations.every((item) => Boolean(item.requirement.trim()) && item.documentLine > 0),
    });
    const repairEligible = classification.disposition === 'repair-candidate';
    const clauses = new Set(['definition' as const, ...obligations.map((item) => item.clause)]);
    const localization = localizeBehaviorRepair(analysis, obligations, elements);
    return {
      stage: 'development',
      classification,
      category:
        diagnostic.code === 'EXECUTION_ERROR'
          ? 'execution'
          : repairEligible
            ? 'behavior'
            : 'unresolved',
      code: diagnostic.code,
      msg: diagnostic.message,
      repairEligible,
      obligationIds: diagnostic.obligationIds,
      obligationKinds: [
        ...new Set(obligations.flatMap((item) => obligationKinds(registration.id, item))),
      ],
      ruleIds: [],
      modelEvidence,
      location: {resolution: 'clause-only'},
      candidateScopes: [...clauses].map((clause) => ({clause, expression: ocl[clause]})),
      localization,
      scenarioId: diagnostic.scenarioId,
      requirementEvidence: obligations.map((obligation) => {
        const source = registration.sources.find(
          (item) => item.id === (obligation.requirementSourceId ?? registration.requirementSourceId)
        )!;
        const modelSource = registration.sources.find(
          (item) => item.id === registration.modelSourceId
        )!;
        return {
          id: obligation.id,
          requirement: obligation.requirement,
          documentLine: obligation.documentLine,
          modelLines: obligation.modelLines,
          sourcePath: source.path,
          sourceSha256: source.sha256,
          modelSourcePath: modelSource.path,
          modelSourceSha256: modelSource.sha256,
          obligationKinds: obligationKinds(registration.id, obligation),
          ...(obligation.evidenceNote ? {evidenceNote: obligation.evidenceNote} : {}),
        };
      }),
      expected: diagnostic.expected,
      observed: diagnostic.observed,
      repair: repairEligible
        ? 'Recheck the cited requirement and its model dependencies. Preserve unrelated obligations; repair the complete contract without specializing it to this scenario.'
        : nonCandidateRepairPolicy(classification),
    };
  });
}

export const routeAfterDevelopment = (
  report: {passed: boolean},
  diagnostics: RepairDiagnostic[],
  generationCount: number,
  budget: number
) =>
  !report.passed &&
  diagnostics.length > 0 &&
  diagnostics.every(isCandidateRepair) &&
  generationCount < budget
    ? ('retry' as const)
    : ('evaluate' as const);
