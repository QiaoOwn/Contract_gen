import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';

export const LIBRARY_ALIGNMENT_OPERATIONS = [
  'countDownSuspensionDay',
  'listOverDueBook',
  'listReservationBook',
] as const;
export type LibraryAlignmentOperation = (typeof LIBRARY_ALIGNMENT_OPERATIONS)[number];
const sources: DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/RequirementDocument.md',
    sha256: '0ce4f753e2df4b33c621d927c52da55890b0815ab151bb492c5523259582b48c',
    note: 'Original generated requirement document; interpretation follows the cited owner-approved adjudication.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/library.remodel',
    sha256: 'd7f4ac436ae349c70b0e908c098f0f02e49516f3e2efec0da673a70ce74fdc53',
  },
];
const obligation = (
  id: string,
  requirement: string,
  documentLine: number,
  modelLines: [number, number],
  modelFeatures: string[]
): DevelopmentObligation => ({
  id,
  clause: id.startsWith('P') ? 'precondition' : 'postcondition',
  requirement,
  documentLine,
  requirementSourceId: 'adjudication',
  modelLines,
  modelFeatures,
  evidenceNote:
    'Owner-approved source clarification, not independent expert certification or an executable reference contract.',
});
const queryObligations = (reservation: boolean): DevelopmentObligation[] => [
  obligation('P01', 'The referenced User exists.', 15, reservation ? [954, 954] : [925, 925], [
    'User.UserID',
    '$parameter.uid',
  ]),
  obligation(
    'P02',
    reservation
      ? 'The reservation collection can be resolved.'
      : 'The overdue active-loan collection can be resolved.',
    16,
    reservation ? [945, 955] : [916, 926],
    reservation ? ['User.ReservedBook'] : ['User.LoanedBook', 'Loan.IsReturned', 'Loan.OverDueFee']
  ),
  obligation(
    'Q01',
    reservation
      ? 'Return the BookCopy identities linked to the selected user reservation records.'
      : 'Return the BookCopy identities linked to the selected user unreturned Loans whose overdue fee is greater than zero.',
    19,
    reservation ? [962, 962] : [933, 933],
    reservation
      ? ['User.ReservedBook', 'Reserve.ReservedCopy', '$result']
      : ['User.LoanedBook', 'Loan.IsReturned', 'Loan.OverDueFee', 'Loan.LoanedCopy', '$result']
  ),
  obligation(
    'Q02',
    'Each referenced BookCopy identity appears once.',
    20,
    reservation ? [962, 962] : [933, 933],
    reservation ? ['Reserve.ReservedCopy', '$result'] : ['Loan.LoanedCopy', '$result']
  ),
  obligation(
    'Q03',
    'Different BookCopy objects remain separate even when their attributes are equal.',
    21,
    reservation ? [962, 962] : [933, 933],
    ['BookCopy', '$result']
  ),
  ...(reservation
    ? [
        obligation(
          'Q04',
          'Include closed reservations; do not add an open-only filter.',
          22,
          [945, 962],
          ['User.ReservedBook', 'Reserve.IsReserveClosed', 'Reserve.ReservedCopy', '$result']
        ),
      ]
    : []),
];
export const libraryAlignmentSpecifications = {
  countDownSuspensionDay: {
    id: 'LibraryManagementSystem_countDownSuspensionDay_countDownSuspensionDay',
    useCase: 'countDownSuspensionDay',
    service: 'LibraryManagementSystemSystem',
    schemaVersion: 'development-library-countdown-adjudicated-v1',
    sources: [
      ...sources,
      {
        id: 'adjudication',
        path: 'data/operation_revision/rm2pt_authority_decisions/R05_countDownSuspensionDay.json',
        sha256: 'c96a4ab299f7348c6caace19041030fb0b0499d4bca94f22160ffcaf4cdc192a',
      },
    ],
    obligations: [
      obligation(
        'Q01',
        'Reduce by one the days of users selected for positive days at operation entry.',
        16,
        [822, 840],
        ['User.SuspensionDays']
      ),
      obligation(
        'Q02',
        'Restore NORMAL only for selected users previously SUSPEND, with no overdue fee, reaching zero after the decrement; do not suspend previously NORMAL users.',
        17,
        [842, 846],
        ['User.SuspensionDays', 'User.BorrowStatus', 'User.OverDueFee']
      ),
      obligation(
        'Q03',
        'Selected users with an outstanding fee remain SUSPEND when their days reach zero.',
        18,
        [842, 846],
        ['User.SuspensionDays', 'User.BorrowStatus', 'User.OverDueFee']
      ),
      obligation(
        'Q04',
        'Users whose days were already zero are not processed and remain unchanged.',
        19,
        [822, 846],
        ['User.SuspensionDays', 'User.BorrowStatus', 'User.OverDueFee']
      ),
    ],
  },
  listOverDueBook: {
    id: 'LibraryManagementSystem_listBookHistory_listOverDueBook',
    useCase: 'listBookHistory',
    service: 'ListBookHistory',
    schemaVersion: 'development-library-overdue-adjudicated-v1',
    sources: [
      ...sources,
      {
        id: 'adjudication',
        path: 'data/operation_revision/rm2pt_authority_decisions/R06_listOverDueBook.json',
        sha256: 'fd5c3c37c2998fe881b8ba430af25e54fcb57bd9752d4387661620df700ca820',
      },
    ],
    obligations: queryObligations(false),
  },
  listReservationBook: {
    id: 'LibraryManagementSystem_listBookHistory_listReservationBook',
    useCase: 'listBookHistory',
    service: 'ListBookHistory',
    schemaVersion: 'development-library-reservations-adjudicated-v1',
    sources: [
      ...sources,
      {
        id: 'adjudication',
        path: 'data/operation_revision/rm2pt_authority_decisions/R07_listReservationBook.json',
        sha256: 'a9a5b7fb1a6220b5bf0a3405eed2b952a91034aa62c1a932695763f32d3e0cfb',
      },
    ],
    obligations: queryObligations(true),
  },
} satisfies Record<
  LibraryAlignmentOperation,
  {
    id: string;
    useCase: string;
    service: string;
    schemaVersion: string;
    sources: DevelopmentSource[];
    obligations: DevelopmentObligation[];
  }
>;

type UserState = {
  days: number;
  status: 'SUSPEND' | 'NORMAL';
  fee: number;
  afterDays: number;
  afterStatus: 'SUSPEND' | 'NORMAL';
};
export type LibraryAlignmentScenario = FiniteScenario & {
  users?: UserState[];
  records?: {
    owner: 'selected' | 'other';
    copy: string;
    returned?: boolean;
    fee?: number;
    closed?: boolean;
  }[];
  expectedCopies?: string[];
  registerCopies?: boolean;
  missingUser?: boolean;
  missingCollection?: boolean;
  emptyUid?: boolean;
};
const valid = (
  operation: LibraryAlignmentOperation,
  id: string,
  values: Omit<LibraryAlignmentScenario, 'id' | 'obligationIds'>
): LibraryAlignmentScenario => ({
  id,
  obligationIds: libraryAlignmentSpecifications[operation].obligations.map((item) => item.id),
  ...values,
});
const reject = (
  id: string,
  rejectObligation: string,
  values: Omit<LibraryAlignmentScenario, 'id' | 'obligationIds'>
): LibraryAlignmentScenario => ({
  id,
  obligationIds: [rejectObligation],
  rejectObligation,
  ...values,
});
export const libraryAlignmentScenarios: Record<
  LibraryAlignmentOperation,
  LibraryAlignmentScenario[]
> = {
  countDownSuspensionDay: [
    valid('countDownSuspensionDay', 'dev-restore-at-one-day', {
      users: [{days: 1, status: 'SUSPEND', fee: 0, afterDays: 0, afterStatus: 'NORMAL'}],
    }),
    valid('countDownSuspensionDay', 'dev-debt-keeps-suspension', {
      users: [{days: 1, status: 'SUSPEND', fee: 4.5, afterDays: 0, afterStatus: 'SUSPEND'}],
    }),
    valid('countDownSuspensionDay', 'dev-not-yet-zero', {
      users: [{days: 4, status: 'SUSPEND', fee: 0, afterDays: 3, afterStatus: 'SUSPEND'}],
    }),
    valid('countDownSuspensionDay', 'dev-zero-users-unchanged', {
      users: [
        {days: 0, status: 'SUSPEND', fee: 0, afterDays: 0, afterStatus: 'SUSPEND'},
        {days: 0, status: 'NORMAL', fee: 8, afterDays: 0, afterStatus: 'NORMAL'},
      ],
    }),
    valid('countDownSuspensionDay', 'dev-normal-and-suspended-mixed', {
      users: [
        {days: 1, status: 'NORMAL', fee: 0, afterDays: 0, afterStatus: 'NORMAL'},
        {days: 3, status: 'NORMAL', fee: 2, afterDays: 2, afterStatus: 'NORMAL'},
        {days: 1, status: 'SUSPEND', fee: 0, afterDays: 0, afterStatus: 'NORMAL'},
      ],
    }),
    valid('countDownSuspensionDay', 'dev-empty-user-repository', {users: []}),
  ],
  listOverDueBook: [
    valid('listOverDueBook', 'dev-shared-copy-on-distinct-loans', {
      records: [
        {owner: 'selected', copy: 'a', fee: 2},
        {owner: 'selected', copy: 'a', fee: 7},
      ],
      expectedCopies: ['a'],
    }),
    valid('listOverDueBook', 'dev-equal-attributes-distinct-copies', {
      records: [
        {owner: 'selected', copy: 'a', fee: 0.5},
        {owner: 'selected', copy: 'b', fee: 3},
      ],
      expectedCopies: ['a', 'b'],
    }),
    valid('listOverDueBook', 'dev-exact-eligibility-and-owner', {
      records: [
        {owner: 'selected', copy: 'a', fee: 2},
        {owner: 'selected', copy: 'returned', fee: 5, returned: true},
        {owner: 'selected', copy: 'zero', fee: 0},
        {owner: 'selected', copy: 'negative', fee: -1},
        {owner: 'other', copy: 'foreign', fee: 9},
      ],
      expectedCopies: ['a'],
    }),
    valid('listOverDueBook', 'dev-linked-copies-without-repository-registration', {
      records: [{owner: 'selected', copy: 'a', fee: 1}],
      expectedCopies: ['a'],
      registerCopies: false,
    }),
    valid('listOverDueBook', 'dev-empty-history', {records: [], expectedCopies: []}),
    valid('listOverDueBook', 'dev-existing-empty-user-id', {
      records: [{owner: 'selected', copy: 'a', fee: 2}],
      expectedCopies: ['a'],
      emptyUid: true,
    }),
    reject('dev-missing-user', 'P01', {missingUser: true, records: [], expectedCopies: []}),
    reject('dev-missing-loan-collection', 'P02', {
      missingCollection: true,
      records: [],
      expectedCopies: [],
    }),
  ],
  listReservationBook: [
    valid('listReservationBook', 'dev-shared-copy-across-open-closed', {
      records: [
        {owner: 'selected', copy: 'a', closed: false},
        {owner: 'selected', copy: 'a', closed: true},
      ],
      expectedCopies: ['a'],
    }),
    valid('listReservationBook', 'dev-equal-attributes-distinct-copies', {
      records: [
        {owner: 'selected', copy: 'a', closed: false},
        {owner: 'selected', copy: 'b', closed: true},
      ],
      expectedCopies: ['a', 'b'],
    }),
    valid('listReservationBook', 'dev-closed-included-foreign-excluded', {
      records: [
        {owner: 'selected', copy: 'closed', closed: true},
        {owner: 'other', copy: 'foreign', closed: false},
      ],
      expectedCopies: ['closed'],
    }),
    valid('listReservationBook', 'dev-linked-copies-without-repository-registration', {
      records: [{owner: 'selected', copy: 'a', closed: true}],
      expectedCopies: ['a'],
      registerCopies: false,
    }),
    valid('listReservationBook', 'dev-empty-reservations', {records: [], expectedCopies: []}),
    valid('listReservationBook', 'dev-existing-empty-user-id', {
      records: [{owner: 'selected', copy: 'a', closed: true}],
      expectedCopies: ['a'],
      emptyUid: true,
    }),
    reject('dev-missing-user', 'P01', {missingUser: true, records: [], expectedCopies: []}),
    reject('dev-missing-reservation-collection', 'P02', {
      missingCollection: true,
      records: [],
      expectedCopies: [],
    }),
  ],
};
