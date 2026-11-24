import type {DevelopmentObligation, DevelopmentSource} from './types';

export const SUBMITTED_REQUESTS_ID =
  'LoanProcessingSystem_enterValidatedCreditReferences_listSubmitedLoanRequest';
export const SUBMITTED_REQUESTS_VERSION = 'development-behavior-submittedLoanRequests-v1';
export const SUBMITTED_REQUESTS_CLOCK = '2026-01-15T12:00:00+08:00';
export const submittedRequestsSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/LoanProcessingSystem/RequirementDocument.md',
    sha256: '57195c7d36692da66bf358663c8f7619225a9987560f0064dbf4079d79e58af2',
    note: 'OP5: selection at line 1520, precondition at 1524, state and return obligations at 1528. RM2Doc and its model share one origin.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/LoanProcessingSystem/loan.remodel',
    sha256: 'ceb5948c8a83c37e726122c5236219944b1ce69c74ed78f1ecafdb40fdd3e40c',
    note: 'Definition at 388 selects every SUBMITTED request; precondition at 395; state and result bindings at 403-404.',
  },
];
export const submittedRequestsObligations: DevelopmentObligation[] = [
  {
    id: 'P01',
    clause: 'precondition',
    requirement: 'At least one submitted LoanRequest must exist.',
    documentLine: 1524,
    modelLines: [395, 395],
    modelFeatures: ['LoanRequest.Status'],
    evidenceNote: 'The selected set is defined at document line 1520 and model line 388.',
  },
  {
    id: 'Q01',
    clause: 'postcondition',
    requirement:
      'CurrentLoanRequests must contain exactly all submitted requests selected at operation entry.',
    documentLine: 1528,
    modelLines: [403, 403],
    modelFeatures: ['LoanRequest.Status', 'self.CurrentLoanRequests'],
    evidenceNote:
      'The source assigns the definition-bound set rs, selected at model line 388 and document line 1520. Set membership, not array identity or order, is required.',
  },
  {
    id: 'Q02',
    clause: 'postcondition',
    requirement: 'Return exactly all submitted requests selected at operation entry.',
    documentLine: 1528,
    modelLines: [404, 404],
    modelFeatures: ['LoanRequest.Status', '$result'],
    evidenceNote:
      'The source returns the same definition-bound set. Both outputs are checked independently against its expected membership.',
  },
];
type Status =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REFERENCESVALIDATED'
  | 'READYFORREVIEW'
  | 'INCOMPLETEINFORMATION';
export type SubmittedRequestsScenario = {
  id: string;
  statuses: Status[];
  staleCurrent?: boolean;
  rejectObligation?: 'P01';
};
export const submittedRequestsScenarios: SubmittedRequestsScenario[] = [
  {id: 'dev-submitted-singleton', statuses: ['SUBMITTED']},
  {
    id: 'dev-submitted-mixed',
    statuses: [
      'APPROVED',
      'SUBMITTED',
      'REFERENCESVALIDATED',
      'SUBMITTED',
      'READYFORREVIEW',
      'INCOMPLETEINFORMATION',
    ],
  },
  {id: 'dev-submitted-all', statuses: ['SUBMITTED', 'SUBMITTED', 'SUBMITTED']},
  {
    id: 'dev-submitted-replace-stale',
    statuses: ['SUBMITTED', 'APPROVED', 'SUBMITTED'],
    staleCurrent: true,
  },
  {
    id: 'dev-submitted-no-matching',
    statuses: ['APPROVED', 'REFERENCESVALIDATED', 'READYFORREVIEW', 'INCOMPLETEINFORMATION'],
    rejectObligation: 'P01',
  },
  {id: 'dev-submitted-empty', statuses: [], rejectObligation: 'P01'},
];
