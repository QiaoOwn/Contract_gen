import type {DevelopmentObligation, DevelopmentSource} from './types';

export const LOAN_PAYMENT_ID = 'LoanProcessingSystem_loanPayment_loanPayment';
export const LOAN_PAYMENT_VERSION = 'development-behavior-loanPayment-v1';
export const LOAN_PAYMENT_CLOCK = '2026-01-15T12:00:00+08:00';
export const loanPaymentSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/LoanProcessingSystem/RequirementDocument.md',
    sha256: '57195c7d36692da66bf358663c8f7619225a9987560f0064dbf4079d79e58af2',
    note: 'OP23, preconditions at line 2739 and postconditions at line 2743. RM2Doc and its model share one origin.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/LoanProcessingSystem/loan.remodel',
    sha256: 'ceb5948c8a83c37e726122c5236219944b1ce69c74ed78f1ecafdb40fdd3e40c',
    note: 'loanPayment lines 922-949. Only RemainAmountToPay is marked @pre; no frame constraint for RepaymentAmount is added.',
  },
];
const obligation = (
  id: string,
  clause: DevelopmentObligation['clause'],
  requirement: string,
  line: number,
  modelFeatures: string[]
): DevelopmentObligation => ({
  id,
  clause,
  requirement,
  documentLine: clause === 'precondition' ? 2739 : 2743,
  modelLines: [line, line],
  modelFeatures,
});
export const loanPaymentObligations: DevelopmentObligation[] = [
  obligation(
    'P01',
    'precondition',
    'The supplied loan identifier must identify an existing Loan.',
    938,
    ['Loan.LoanID', '$parameter.loanid']
  ),
  obligation('P02', 'precondition', 'The referenced Loan must have LSOPEN status.', 939, [
    'Loan.Status',
  ]),
  {
    ...obligation(
      'Q01',
      'postcondition',
      'The remaining amount must equal its value before this invocation minus the Loan repayment amount.',
      947,
      ['Loan.RemainAmountToPay', 'Loan.RepaymentAmount']
    ),
    evidenceNote:
      'Only the remaining amount is pre-state in the source formula. The repayment amount is read from the post-state; its preservation, a nonnegative result and clamping to zero are not inferred.',
  },
  obligation('Q02', 'postcondition', 'The successful repayment must return true.', 948, [
    '$result',
  ]),
];
export type LoanPaymentScenario = {
  id: string;
  loanId: number;
  exists: boolean;
  status: 'LSOPEN' | 'CLOSED';
  remaining: number;
  repayment: number;
  neighbors: boolean;
  rejectObligation?: 'P01' | 'P02';
};
const base = {
  loanId: 978001,
  exists: true,
  status: 'LSOPEN' as const,
  remaining: 1000,
  repayment: 125,
  neighbors: true,
};
// Boundary amounts follow the explicit formula without adding an unstated payment-limit guard.
export const loanPaymentScenarios: LoanPaymentScenario[] = [
  {id: 'dev-payment-standard', ...base},
  {id: 'dev-payment-decimal', ...base, loanId: 978002, remaining: 455.75, repayment: 60.25},
  {id: 'dev-payment-exact-balance', ...base, loanId: 978003, remaining: 80, repayment: 80},
  {id: 'dev-payment-exceeds-balance', ...base, loanId: 978004, remaining: 30, repayment: 60},
  {id: 'dev-payment-zero-repayment', ...base, loanId: 978005, remaining: 120, repayment: 0},
  {id: 'dev-payment-closed', ...base, status: 'CLOSED', rejectObligation: 'P02'},
  {id: 'dev-payment-missing-with-neighbor', ...base, exists: false, rejectObligation: 'P01'},
  {
    id: 'dev-payment-empty-repository',
    ...base,
    exists: false,
    neighbors: false,
    rejectObligation: 'P01',
  },
];
