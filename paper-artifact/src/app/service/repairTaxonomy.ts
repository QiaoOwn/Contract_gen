import {dialectDiagnosticRule} from './dialectDiagnosticRules';
export const REPAIR_TAXONOMY_VERSION = 'evidence-guided-repair-taxonomy-v2';

export type RepairStage =
  | 'parser'
  | 'subset'
  | 'model'
  | 'lowering'
  | 'typescript'
  | 'development'
  | 'guard';
export const REPAIR_FAMILY_LABELS = {
  SYN: 'Candidate syntax',
  DIA: 'Dialect boundary',
  MOD: 'Model structure or binding',
  LOW: 'Executable lowering',
  TSC: 'TypeScript static diagnostics',
  BEH: 'Source-grounded behavior',
  SRC: 'Source or evidence integrity',
  INF: 'Infrastructure',
  UNK: 'Unresolved observation',
} as const;
export type RepairFamily = keyof typeof REPAIR_FAMILY_LABELS;
export type RepairDisposition =
  | 'repair-candidate'
  | 'restore-environment'
  | 'review-source'
  | 'review-capability'
  | 'review-repair'
  | 'inspect-tool';
export type RepairClassification = {
  version: typeof REPAIR_TAXONOMY_VERSION;
  family: RepairFamily;
  evidenceKind:
    | 'validator-diagnostic'
    | 'model-declaration'
    | 'development-observation'
    | 'runtime-failure'
    | 'unresolved';
  disposition: RepairDisposition;
};

export const requirementPreservationPolicy =
  'Preserve all source-required obligations and unaffected clauses. Remove an extra restriction only when the cited requirement evidence supports its removal; retain every source-required precondition and postcondition. Do not alter the model, signature, dialect or tests, replace obligations with true, or special-case fixture identifiers.';

const environmentCodes = new Set([
  'ENOENT',
  'EACCES',
  'EPERM',
  'ENOSPC',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'DEVELOPMENT_RUNNER_ERROR',
]);
const compilerEnvironmentCodes = new Set(['2307', '2318', '2688', '6053']);
const candidateCompilerCodes = new Set(['2304', '2322', '2339', '2345', '2365', '2367', '2551', '2552']);
const candidateLoweringCodes = new Set([
  'OCL_NEW_TYPE_UNKNOWN',
  'OCL_NEW_TARGET_INVALID',
  'OCL_VARIABLE_UNBOUND',
]);

// These codes are emitted at known candidate-use sites, not inferred from message substrings.
export class CandidateLoweringError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CandidateLoweringError';
  }
}

export function classifyRepairDiagnostic(
  stage: RepairStage,
  code: unknown,
  evidence: {
    modelRule?: boolean;
    modelDeclaration?: boolean;
    requirementObligation?: boolean;
  } = {}
): RepairClassification {
  const result = (
    family: RepairFamily,
    evidenceKind: RepairClassification['evidenceKind'],
    disposition: RepairDisposition
  ): RepairClassification => ({
    version: REPAIR_TAXONOMY_VERSION,
    family,
    evidenceKind,
    disposition,
  });
  const rawCode = String(code ?? '');
  if (stage === 'guard') {
    if (rawCode === 'PLANNING_REVIEW_REQUIRED')
      return result('UNK', 'unresolved', 'review-source');
    if (['READ_ONLY_EVIDENCE_CHANGED', 'READ_ONLY_EVIDENCE_MISSING'].includes(rawCode))
      return result('SRC', 'validator-diagnostic', 'review-source');
    if (rawCode === 'REPAIR_SCOPE_VIOLATION')
      return result('UNK', 'validator-diagnostic', 'review-repair');
    return result('UNK', 'unresolved', 'inspect-tool');
  }
  if (
    environmentCodes.has(rawCode) ||
    (stage === 'typescript' && compilerEnvironmentCodes.has(rawCode))
  )
    return result('INF', 'runtime-failure', 'restore-environment');
  if (stage === 'parser') return result('SYN', 'validator-diagnostic', 'repair-candidate');
  if (stage === 'subset')
    return result(
      'DIA',
      'validator-diagnostic',
      dialectDiagnosticRule(code)?.action ?? 'repair-candidate'
    );
  if (stage === 'model' && evidence.modelRule)
    return result(
      'MOD',
      evidence.modelDeclaration ? 'model-declaration' : 'validator-diagnostic',
      'repair-candidate'
    );
  if (stage === 'lowering')
    return result(
      'LOW',
      candidateLoweringCodes.has(rawCode) ? 'validator-diagnostic' : 'unresolved',
      candidateLoweringCodes.has(rawCode) ? 'repair-candidate' : 'inspect-tool'
    );
  if (stage === 'typescript')
    return result(
      'TSC',
      'validator-diagnostic',
      candidateCompilerCodes.has(rawCode) ? 'repair-candidate' : 'inspect-tool'
    );
  if (stage === 'development') {
    if (rawCode === 'SPECIFICATION_DETAIL_MISMATCH')
      return result('SRC', 'unresolved', 'review-source');
    if (
      ['OBLIGATION_MISMATCH', 'UNEXPECTED_REJECTION'].includes(rawCode) &&
      evidence.requirementObligation
    )
      return result('BEH', 'development-observation', 'repair-candidate');
  }
  return result('UNK', 'unresolved', 'inspect-tool');
}

export const nonCandidateRepairPolicy = (classification: RepairClassification) =>
  classification.disposition === 'review-capability'
    ? 'Stop candidate repair and review the unsupported capability. Do not remove obligations or replace Bag semantics with Set semantics without an explicit equivalence justification.'
    : classification.disposition === 'review-repair'
      ? 'Review the out-of-scope candidate changes. Preserve the authoritative model, requirement and tests; do not accept the repair by weakening unrelated obligations.'
      : classification.disposition === 'restore-environment'
        ? 'Restore the runtime or dependency environment. Do not change business OCL to hide this failure.'
        : classification.disposition === 'review-source'
          ? 'Resolve the requirement or specification alignment with its owner before changing business OCL.'
          : 'Inspect the tool or unresolved observation before changing business OCL; the root cause is not established.';

export const isCandidateRepair = (diagnostic: {
  repairEligible: boolean;
  classification: RepairClassification;
}) => diagnostic.repairEligible && diagnostic.classification.disposition === 'repair-candidate';
