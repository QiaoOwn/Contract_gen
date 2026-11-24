import type {RepairDiagnostic} from './repairDiagnostics';
import {classifyRepairDiagnostic, nonCandidateRepairPolicy} from './repairTaxonomy';

export const REPAIR_GUARD_CODES = [
  'READ_ONLY_EVIDENCE_CHANGED',
  'READ_ONLY_EVIDENCE_MISSING',
  'REPAIR_SCOPE_VIOLATION',
  'PLANNING_REVIEW_REQUIRED',
] as const;
export type RepairGuardCode = (typeof REPAIR_GUARD_CODES)[number];
export function repairGuardDiagnostic(code: RepairGuardCode, msg: string): RepairDiagnostic {
  const classification = classifyRepairDiagnostic('guard', code);
  return {
    stage: 'guard',
    classification,
    category: 'unresolved',
    code,
    msg,
    repairEligible: false,
    obligationIds: [],
    ruleIds: [],
    modelEvidence: [],
    location: {resolution: 'unknown'},
    repair: nonCandidateRepairPolicy(classification),
  };
}
export class RepairGuardError extends Error {
  readonly diagnostic: RepairDiagnostic;
  constructor(
    public readonly code: RepairGuardCode,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = 'RepairGuardError';
    this.diagnostic = repairGuardDiagnostic(code, message);
  }
}
export const repairGuardErrorPayload = (error: unknown) =>
  error instanceof RepairGuardError ? {code: error.code, repairDiagnostic: error.diagnostic,
    ...('planningReport' in error ? {planningReport: error.planningReport} : {})} : {};
