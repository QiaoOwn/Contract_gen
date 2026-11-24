import clarification from '../../../../data/benchmark/lab_adjudicated_114_v2/requirement-clarification-decisions.json';
import type {DevelopmentObligation} from './types';
export type {DevelopmentObligation} from './types';

export const DEVELOPMENT_BEHAVIOR_VERSION = 'development-behavior-borrowBook-v2';
export const BORROW_BOOK_ID = 'LibraryManagementSystem_borrowBook_borrowBook';
export const BORROW_BOOK_CLOCK = '2026-01-15T12:00:00+08:00';

export const borrowBookAssessmentPolicy = {
  businessRejection:
    'An ineligible borrowing request must not complete a successful checkout. The business specification does not prescribe an exception class.',
  executionConvention:
    'The current OCLTSVM adapter recognizes PreconditionError as an explicit rejection signal. A bare false return is not interpreted as rejection without a confirmed adapter contract.',
  definitionBindingFailure:
    'Unresolved: inspect whether this is an intended rejection path or an accidental evaluation failure; do not automatically label it correct rejection or a business violation.',
  dateComparison: 'Calendar-day equality and calendar-day addition, not timestamp equality.',
  userScope: {
    covered: ['Student', 'Faculty'],
    unresolved: ['User that is neither Student nor Faculty'],
    action: 'Do not infer its eligibility, quota or due date. No coverage claim for this case.',
  },
  decision: {
    role: 'researcher-instruction',
    basis: 'User requested implementation of the proposed review corrections on 2026-10-19.',
    scope:
      'Assessment protocol only; not independent expert review or approval of every obligation.',
  },
} as const;

const borrowBookAssociationDetails = [
  {
    obligationId: 'Q07',
    generationExcerpt:
      'A new unreturned Loan is created and linked to the User and BookCopy with today as the loan date.',
    sourceDetail: 'User.LoanedBook contains the new Loan.',
    note: 'Check whether the approved collection-update statement is explicitly present in the supplied generation requirement; do not infer inverse maintenance merely from model structure.',
  },
  {
    obligationId: 'Q08',
    generationExcerpt:
      'A new unreturned Loan is created and linked to the User and BookCopy with today as the loan date.',
    sourceDetail: 'BookCopy.LoanedRecord contains the new Loan.',
    note: 'The researcher approved this source-supported clarification. Existing saved candidates are not thereby regenerated or relabeled as new-input experiments.',
  },
] as const;

export const assessBorrowBookInputAlignment = (description: string) =>
  borrowBookAssociationDetails.map((detail) => {
    const addition = clarification.additions.find(
      (item) => item.obligation_id === detail.obligationId
    )!;
    return {
      ...detail,
      approvedStatement: addition.statement,
      clarificationId: clarification.id,
      status: description.includes(addition.statement)
        ? 'explicit-in-generation-text'
        : 'not-explicit-in-generation-text',
      assessmentBasis: 'exact approved NL statement presence, not a general NL equivalence proof',
    };
  });

export const borrowBookSources = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/RequirementDocument.md',
    sha256: '0ce4f753e2df4b33c621d927c52da55890b0815ab151bb492c5523259582b48c',
    note: 'OP8 operation specification. This document is generated from the RM2PT model, not an independent second source.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/library.remodel',
    sha256: 'd7f4ac436ae349c70b0e908c098f0f02e49516f3e2efec0da673a70ce74fdc53',
    note: 'Original operation contract; read-only evidence, never supplied as a reference answer.',
  },
] as const;

const obligation = (
  id: string,
  clause: DevelopmentObligation['clause'],
  requirement: string,
  modelLines: [number, number],
  modelFeatures: string[]
): DevelopmentObligation => ({
  id,
  clause,
  requirement,
  modelLines,
  modelFeatures,
  documentLine: clause === 'precondition' ? 2363 : 2367,
});

export const borrowBookObligations: DevelopmentObligation[] = [
  obligation('P01', 'precondition', 'The supplied user must exist.', [398, 398], ['User.UserID']),
  obligation(
    'P02',
    'precondition',
    'The supplied book copy must exist.',
    [399, 399],
    ['BookCopy.Barcode']
  ),
  obligation(
    'P03',
    'precondition',
    'The user must have NORMAL borrowing status.',
    [400, 400],
    ['User.BorrowStatus']
  ),
  obligation(
    'P04',
    'precondition',
    'The user must have zero suspension days.',
    [401, 401],
    ['User.SuspensionDays']
  ),
  obligation(
    'P05',
    'precondition',
    'The current loan count must be below the programme-specific or faculty quota.',
    [402, 411],
    ['Student.Programme', 'User.LoanedNumber']
  ),
  obligation(
    'P06',
    'precondition',
    'The copy must be available, or on the hold shelf with an open reservation matching both this user and this copy.',
    [384, 444],
    [
      'BookCopy.Status',
      'BookCopy.IsReserved',
      'Reserve.ReservedUser',
      'Reserve.ReservedCopy',
      'Reserve.IsReserveClosed',
    ]
  ),
  obligation('Q01', 'postcondition', 'A new Loan must be registered.', [448, 469], ['Loan']),
  obligation(
    'Q02',
    'postcondition',
    'The new loan must refer to the requesting user.',
    [450, 450],
    ['Loan.LoanedUser']
  ),
  obligation(
    'Q03',
    'postcondition',
    'The new loan must refer to the requested copy.',
    [451, 451],
    ['Loan.LoanedCopy']
  ),
  obligation(
    'Q04',
    'postcondition',
    'The new loan must not be returned.',
    [452, 452],
    ['Loan.IsReturned']
  ),
  obligation('Q05', 'postcondition', 'The loan date must be today.', [453, 453], ['Loan.LoanDate']),
  obligation(
    'Q06',
    'postcondition',
    'The loan count must increase by one from its pre-state value.',
    [454, 454],
    ['User.LoanedNumber']
  ),
  obligation(
    'Q07',
    'postcondition',
    'The user loan collection must contain the new loan.',
    [455, 455],
    ['User.LoanedBook']
  ),
  obligation(
    'Q08',
    'postcondition',
    'The copy loan collection must contain the new loan.',
    [456, 456],
    ['BookCopy.LoanedRecord']
  ),
  obligation(
    'Q09',
    'postcondition',
    'The due date must be 30 days for a Student and 60 days for a Faculty user.',
    [457, 460],
    ['Student', 'Faculty', 'Loan.DueDate']
  ),
  obligation(
    'Q10',
    'postcondition',
    'For a copy previously on the hold shelf, clear its reserved flag.',
    [461, 462],
    ['BookCopy.Status', 'BookCopy.IsReserved']
  ),
  obligation(
    'Q11',
    'postcondition',
    'For a copy previously on the hold shelf, close the matching reservation.',
    [461, 463],
    ['Reserve.ReservedUser', 'Reserve.ReservedCopy', 'Reserve.IsReserveClosed']
  ),
  obligation(
    'Q12',
    'postcondition',
    'The copy status must become LOANED.',
    [464, 464],
    ['BookCopy.Status']
  ),
  ...[3, 10, 17, 31].map((days, index) =>
    obligation(
      `Q${13 + index}`,
      'postcondition',
      `The ${days}-day overdue flag must start as false.`,
      [465 + index, 465 + index],
      [`Loan.OverDue${days}Days`]
    )
  ),
  obligation(
    'Q17',
    'postcondition',
    'The successful operation must return true.',
    [470, 470],
    ['$result']
  ),
];

export type BorrowBookScenario = {
  id: string;
  kind: 'student' | 'faculty';
  programme?: 'BACHELOR' | 'MASTER' | 'PHD';
  loanCount: number;
  copy: 'AVAILABLE' | 'ONHOLDSHELF' | 'LOANED';
  reservation?: 'matching' | 'foreign';
  missing?: 'user' | 'copy';
  suspended?: boolean;
  suspensionDays?: number;
  rejectObligation?: string;
};

export const borrowBookScenarios: BorrowBookScenario[] = [
  {
    id: 'dev-master-available',
    kind: 'student',
    programme: 'MASTER',
    loanCount: 6,
    copy: 'AVAILABLE',
  },
  {
    id: 'dev-faculty-matching-reservation',
    kind: 'faculty',
    loanCount: 7,
    copy: 'ONHOLDSHELF',
    reservation: 'matching',
  },
  {
    id: 'dev-bachelor-available',
    kind: 'student',
    programme: 'BACHELOR',
    loanCount: 8,
    copy: 'AVAILABLE',
  },
  {id: 'dev-phd-available', kind: 'student', programme: 'PHD', loanCount: 11, copy: 'AVAILABLE'},
  {
    id: 'dev-missing-user',
    kind: 'student',
    loanCount: 6,
    copy: 'AVAILABLE',
    missing: 'user',
    rejectObligation: 'P01',
  },
  {
    id: 'dev-missing-copy',
    kind: 'faculty',
    loanCount: 7,
    copy: 'AVAILABLE',
    missing: 'copy',
    rejectObligation: 'P02',
  },
  {
    id: 'dev-suspended-user',
    kind: 'student',
    loanCount: 6,
    copy: 'AVAILABLE',
    suspended: true,
    rejectObligation: 'P03',
  },
  {
    id: 'dev-suspension-days',
    kind: 'faculty',
    loanCount: 7,
    copy: 'AVAILABLE',
    suspensionDays: 9,
    rejectObligation: 'P04',
  },
  ...(['BACHELOR', 'MASTER', 'PHD'] as const).map(
    (programme, index): BorrowBookScenario => ({
      id: `dev-${programme.toLowerCase()}-above-quota`,
      kind: 'student',
      programme,
      loanCount: [21, 41, 61][index],
      copy: 'AVAILABLE',
      rejectObligation: 'P05',
    })
  ),
  {
    id: 'dev-faculty-above-quota',
    kind: 'faculty',
    loanCount: 61,
    copy: 'AVAILABLE',
    rejectObligation: 'P05',
  },
  {
    id: 'dev-foreign-reservation',
    kind: 'student',
    loanCount: 6,
    copy: 'ONHOLDSHELF',
    reservation: 'foreign',
    rejectObligation: 'P06',
  },
  {
    id: 'dev-copy-already-loaned',
    kind: 'faculty',
    loanCount: 7,
    copy: 'LOANED',
    rejectObligation: 'P06',
  },
];
