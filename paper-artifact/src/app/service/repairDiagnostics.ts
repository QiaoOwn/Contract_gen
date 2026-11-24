import type {ModelRuleDiagnostic, ContractClause} from './modelRuleDiagnostics';
import type {ModelSource} from './modelIndex';
import type {BehaviorLocalization} from './repairLocalization';
import {dialectDiagnosticRule} from './dialectDiagnosticRules';
import type {ObligationKind} from './developmentBehavior/obligationKinds';
import type {SlotRepairDirective} from './semanticPlanRepair';
import {
  classifyRepairDiagnostic,
  isCandidateRepair,
  nonCandidateRepairPolicy,
  requirementPreservationPolicy,
  type RepairClassification,
  type RepairStage,
} from './repairTaxonomy';

export type RepairDiagnostic = {
  stage: RepairStage;
  classification: RepairClassification;
  category:
    | 'syntax'
    | 'model-structure'
    | 'translation'
    | 'type'
    | 'behavior'
    | 'execution'
    | 'unresolved';
  code: string;
  msg: string;
  repairEligible: boolean;
  obligationIds: string[];
  ruleIds: string[];
  modelEvidence: {id: string; declaration: string; source: ModelSource | null}[];
  location: {
    resolution: 'ocl-expression' | 'generated-typescript' | 'clause-only' | 'unknown';
    clause?: ContractClause;
    line?: number;
    column?: number;
  };
  candidateScopes?: {clause: ContractClause; expression: string}[];
  localization?: BehaviorLocalization;
  obligationKinds?: readonly ObligationKind[];
  scenarioId?: string;
  slotRepair?: SlotRepairDirective;
  requirementEvidence?: {
    id: string;
    requirement: string;
    documentLine: number;
    modelLines: [number, number];
    sourcePath?: string;
    sourceSha256?: string;
    modelSourcePath?: string;
    modelSourceSha256?: string;
    obligationKinds?: readonly ObligationKind[];
    evidenceNote?: string;
  }[];
  expected?: unknown;
  observed?: unknown;
  repair: string;
};

export const unifyStaticDiagnostics = (
  stage: Exclude<RepairDiagnostic['stage'], 'development'>,
  errors: {
    line?: number;
    column?: number;
    msg?: string;
    message?: string;
    code?: unknown;
    clause?: ContractClause;
    ruleIds?: readonly string[];
  }[]
): RepairDiagnostic[] =>
  errors.map((error) => {
    const model =
      'kind' in error && error.kind === 'model-rule' ? (error as ModelRuleDiagnostic) : null;
    const classification = classifyRepairDiagnostic(model ? 'model' : stage, error.code, {
      modelRule: Boolean(model),
      modelDeclaration: Boolean(model?.modelEvidence.length),
    });
    const repairEligible = classification.disposition === 'repair-candidate';
    return {
      stage: model ? 'model' : stage,
      classification,
      category: model
        ? 'model-structure'
        : stage === 'lowering'
          ? 'translation'
          : stage === 'typescript'
            ? 'type'
            : 'syntax',
      code: String(error.code ?? stage.toUpperCase()),
      msg: error.msg ?? error.message ?? String(error),
      repairEligible,
      obligationIds: [],
      ruleIds: model?.ruleIds ?? [
        ...(error.ruleIds ?? dialectDiagnosticRule(error.code)?.ruleIds ?? []),
      ],
      modelEvidence: model?.modelEvidence ?? [],
      location: model
        ? {
            resolution: 'ocl-expression',
            clause: model.clause,
            line: model.line,
            column: model.column,
          }
        : {
            resolution:
              stage === 'typescript'
                ? 'generated-typescript'
                : stage === 'lowering'
                  ? 'unknown'
                  : 'ocl-expression',
            line: error.line,
            column: error.column,
            ...(stage === 'subset' && error.clause ? {clause: error.clause} : {}),
          },
      ...(model
        ? {
            candidateScopes: [model, ...model.relatedLocations].map((site) => ({
              clause: site.clause,
              expression: site.expression,
            })),
          }
        : {}),
      repair: repairEligible
        ? (model?.repair ?? requirementPreservationPolicy)
        : nonCandidateRepairPolicy(classification),
    };
  });

export const renderBehaviorRepairDiagnostics = (diagnostics: RepairDiagnostic[]) =>
  [
    'Development-side requirement repair (not hidden evaluation feedback):',
    requirementPreservationPolicy,
    'The listed clauses and dependencies are a search scope, not a proven root cause. Return the complete definition/precondition/postcondition JSON; it will undergo all validation stages again.',
    ...diagnostics
      .filter((item) => item.stage === 'development' && isCandidateRepair(item))
      .flatMap((item) => [
        `[development/${item.code}] ${item.msg}`,
        `Scenario: ${item.scenarioId}; obligations: ${item.obligationIds.join(', ')}`,
        ...(item.obligationKinds?.length
          ? [
              `Violated obligation kinds: ${item.obligationKinds.join(', ')}. These describe obligations, not proven root causes.`,
            ]
          : []),
        ...(item.requirementEvidence ?? []).map((evidence) =>
          [
            `Requirement ${evidence.id}: ${evidence.requirement}`,
            ...(evidence.sourcePath
              ? [
                  `Requirement source: ${evidence.sourcePath}:${evidence.documentLine} (sha256 ${evidence.sourceSha256})`,
                ]
              : []),
            ...(evidence.evidenceNote ? [`Evidence note: ${evidence.evidenceNote}`] : []),
            ...(evidence.modelSourcePath
              ? [
                  `Read-only original model source: ${evidence.modelSourcePath}:${evidence.modelLines[0]}-${evidence.modelLines[1]} (sha256 ${evidence.modelSourceSha256}); source positions are evidence links, not reference contract text.`,
                ]
              : []),
          ].join('\n')
        ),
        ...item.modelEvidence.map(
          (evidence) =>
            `Read-only model declaration: ${evidence.declaration} [${evidence.id}]${evidence.source ? `; ${evidence.source.file}:${evidence.source.line} (sha256 ${evidence.source.sha256})` : ''}`
        ),
        ...(item.localization
          ? [
              `Localization (${item.localization.coordinateSpace}): ${item.localization.note}`,
              ...item.localization.candidates.flatMap((site) => [
                `Candidate expression: ${site.clause}, line ${site.line}, column ${site.column}, offsets [${site.startOffset}, ${site.endOffset}): ${site.expression}`,
                ...site.guards.map(
                  (guard) =>
                    `Enclosing conditional guard: line ${guard.line}, column ${guard.column}: ${guard.expression}`
                ),
              ]),
              ...(item.localization.gaps ?? []).flatMap((gap) => [
                `Possible obligation gap ${gap.obligationId ?? '(unidentified)'}: ${gap.targets.map((target) => `${target.name} [${target.modelElementId}]`).join(', ')}; evidence: ${gap.evidence}. Absence of a direct reference is not a proof that the effect is missing.`,
                `Insertion search region: ${gap.clause}, clause-body offsets [${gap.searchRegion.startOffset}, ${gap.searchRegion.endOffset}); this is a search region, not the position of a missing statement. Recheck the cited source obligation and preserve existing effects and conditions.`,
              ]),
              ...(item.localization.contextAnchors ?? []).map(
                (site) =>
                  `Related context anchor (not diagnosed as faulty): ${site.clause}, line ${site.line}, column ${site.column}: ${site.expression}`
              ),
              ...item.localization.dependencies.map(
                (binding) =>
                  `Candidate binding dependency ${binding.name}: ${binding.declaration.clause}, line ${binding.declaration.line}, column ${binding.declaration.column}: ${binding.declaration.expression}`
              ),
            ]
          : []),
        `Expected: ${JSON.stringify(item.expected)}; observed: ${JSON.stringify(item.observed)}`,
        `Search scope: ${item.candidateScopes?.map((scope) => scope.clause).join(', ') ?? 'unknown'}`,
        `Repair policy: ${item.repair}`,
      ]),
  ].join('\n');
