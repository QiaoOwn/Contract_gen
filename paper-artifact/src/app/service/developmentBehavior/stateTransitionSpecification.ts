import type {DevelopmentObligation, DevelopmentSource} from './types';

export const STATE_TRANSITION_CLOCK = '2026-01-15T12:00:00+08:00';
const cocomeSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'OP1-4 pre/post tables individually inspected. RM2Doc and remodel share one origin, not independent oracles.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Lines 234-364: explicit existence/state guards, state updates, current-object assignments and true returns only.',
  },
];
const loanSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/LoanProcessingSystem/RequirementDocument.md',
    sha256: '57195c7d36692da66bf358663c8f7619225a9987560f0064dbf4079d79e58af2',
    note: 'OP24 table, lines 2805-2813. No balance guard is stated in this operation specification.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/LoanProcessingSystem/loan.remodel',
    sha256: 'ceb5948c8a83c37e726122c5236219944b1ce69c74ed78f1ecafdb40fdd3e40c',
    note: 'Lines 960-978: existing LSOPEN Loan transitions to CLOSED and returns true. Do not infer a zero-balance precondition from the higher-level use case.',
  },
];
export type StateTransitionOperation =
  | 'openStore'
  | 'closeStore'
  | 'openCashDesk'
  | 'closeCashDesk'
  | 'closeOutLoan';
export type TransitionSpecification = {
  id: string;
  project: 'CoCoME' | 'LoanProcessingSystem';
  useCase: StateTransitionOperation;
  operation: StateTransitionOperation;
  service: string;
  entity: 'Store' | 'CashDesk' | 'Loan';
  identifier: string;
  parameter: string;
  feature: string;
  before: boolean | 'LSOPEN';
  after: boolean | 'CLOSED';
  current?: 'CurrentStore' | 'CurrentCashDesk';
  parentStore: boolean;
  schemaVersion: string;
  sources: readonly DevelopmentSource[];
  obligations: DevelopmentObligation[];
};
function specification(
  operation: StateTransitionOperation,
  entity: TransitionSpecification['entity'],
  before: TransitionSpecification['before'],
  after: TransitionSpecification['after'],
  docPre: number,
  docPost: number,
  modelPre: number,
  modelPost: number,
  current?: TransitionSpecification['current']
): TransitionSpecification {
  const loan = entity === 'Loan',
    parentStore = entity === 'CashDesk';
  const feature = loan ? 'Status' : 'IsOpened';
  const parameter = loan ? 'loanid' : parentStore ? 'cashDeskID' : 'storeID';
  const identifier = loan ? 'LoanID' : 'Id';
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
    documentLine: clause === 'precondition' ? docPre : docPost,
    modelLines: [line, line],
    modelFeatures,
  });
  const obligations = [
    obligation(
      'P01',
      'precondition',
      `The supplied identifier must identify an existing ${entity}.`,
      modelPre,
      [`${entity}.${identifier}`, `$parameter.${parameter}`]
    ),
    obligation(
      'P02',
      'precondition',
      `The referenced ${entity}.${feature} must be ${String(before)}.`,
      modelPre + 1,
      [`${entity}.${feature}`]
    ),
    ...(parentStore
      ? [
          obligation('P03', 'precondition', 'A current Store must be defined.', modelPre + 2, [
            'self.CurrentStore',
          ]),
          obligation('P04', 'precondition', 'The current Store must be open.', modelPre + 3, [
            'self.CurrentStore',
            'Store.IsOpened',
          ]),
        ]
      : []),
    obligation(
      'Q01',
      'postcondition',
      `The referenced ${entity}.${feature} becomes ${String(after)}.`,
      modelPost + (current ? 1 : 0),
      [`${entity}.${feature}`]
    ),
    ...(current
      ? [
          obligation(
            'Q02',
            'postcondition',
            `The service ${current} must refer to the selected ${entity}.`,
            modelPost,
            [`self.${current}`, `${entity}.${identifier}`, `$parameter.${parameter}`]
          ),
        ]
      : []),
    obligation(
      'Q03',
      'postcondition',
      'The successful operation must return true.',
      modelPost + (current ? 2 : 1),
      ['$result']
    ),
  ];
  return {
    id: `${loan ? 'LoanProcessingSystem' : 'CoCoME'}_${operation}_${operation}`,
    project: loan ? 'LoanProcessingSystem' : 'CoCoME',
    useCase: operation,
    operation,
    service: loan ? 'LoanProcessingSystemSystem' : 'CoCoMESystem',
    entity,
    identifier,
    parameter,
    feature,
    before,
    after,
    current,
    parentStore,
    schemaVersion: `development-behavior-${operation}-v1`,
    sources: loan ? loanSources : cocomeSources,
    obligations,
  };
}

// Source mappings for the evaluator only; the generator never imports this catalogue.
export const stateTransitionSpecifications: Record<
  StateTransitionOperation,
  TransitionSpecification
> = {
  openStore: specification('openStore', 'Store', false, true, 1720, 1724, 250, 260, 'CurrentStore'),
  closeStore: specification('closeStore', 'Store', true, false, 1792, 1796, 282, 291),
  openCashDesk: specification(
    'openCashDesk',
    'CashDesk',
    false,
    true,
    1862,
    1866,
    314,
    326,
    'CurrentCashDesk'
  ),
  closeCashDesk: specification(
    'closeCashDesk',
    'CashDesk',
    true,
    false,
    1938,
    1942,
    350,
    362,
    'CurrentCashDesk'
  ),
  closeOutLoan: specification('closeOutLoan', 'Loan', 'LSOPEN', 'CLOSED', 2809, 2813, 968, 977),
};
export type TransitionScenario = {
  id: string;
  identifier: number;
  exists: boolean;
  correctState: boolean;
  neighbors: boolean;
  parentExists: boolean;
  parentOpen: boolean;
  rejectObligation?: string;
};
export function transitionScenarios(spec: TransitionSpecification): TransitionScenario[] {
  const base = {
    identifier: 981001,
    exists: true,
    correctState: true,
    neighbors: true,
    parentExists: true,
    parentOpen: true,
  };
  return [
    {id: 'dev-transition-standard', ...base},
    {id: 'dev-transition-negative-id', ...base, identifier: -981002},
    {id: 'dev-transition-missing-with-neighbor', ...base, exists: false, rejectObligation: 'P01'},
    {id: 'dev-transition-wrong-state', ...base, correctState: false, rejectObligation: 'P02'},
    {
      id: 'dev-transition-empty-repository',
      ...base,
      exists: false,
      neighbors: false,
      rejectObligation: 'P01',
    },
    ...(spec.parentStore
      ? [
          {
            id: 'dev-transition-no-current-store',
            ...base,
            parentExists: false,
            rejectObligation: 'P03',
          },
          {
            id: 'dev-transition-closed-current-store',
            ...base,
            parentOpen: false,
            rejectObligation: 'P04',
          },
        ]
      : []),
  ];
}
