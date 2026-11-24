import type {DevelopmentObligation} from './types';
import {submittedRequestsSources} from './submittedLoanRequestsSpecification';

export const ADD_LOAN_TERM_ID = 'LoanProcessingSystem_evaluateLoanRequest_addLoanTerm';
export const ADD_LOAN_TERM_VERSION = 'development-behavior-addLoanTerm-v1';
export const addLoanTermSources = submittedRequestsSources.map((source) => ({
  ...source,
  note:
    source.id === 'requirement-document'
      ? 'OP13: identifier selection at 2018, preconditions at 2022 and link/result at 2026. The generated document and originating model share one source.'
      : 'Original addLoanTerm specification at lines 571-598, lookup at 579, preconditions at 587-588, effects at 596-597.',
}));
export const addLoanTermObligations: DevelopmentObligation[] = [
  {
    id: 'P01',
    clause: 'precondition',
    requirement: 'A current LoanRequest must exist.',
    documentLine: 2022,
    modelLines: [587, 587],
    modelFeatures: ['self.CurrentLoanRequest'],
  },
  {
    id: 'P02',
    clause: 'precondition',
    requirement: 'The LoanTerm selected by the supplied termid must exist.',
    documentLine: 2022,
    modelLines: [579, 588],
    modelFeatures: ['LoanTerm.ItemID', '$parameter.termid'],
  },
  {
    id: 'Q01',
    clause: 'postcondition',
    requirement:
      'The selected term is a member of the current request AttachedLoanTerms association.',
    documentLine: 2026,
    modelLines: [596, 596],
    modelFeatures: ['self.CurrentLoanRequest', 'LoanRequest.AttachedLoanTerms', 'LoanTerm.ItemID'],
    localizationTargets: ['LoanRequest.AttachedLoanTerms'],
  },
  {
    id: 'Q02',
    clause: 'postcondition',
    requirement: 'The successful operation returns true.',
    documentLine: 2026,
    modelLines: [597, 597],
    modelFeatures: ['$result'],
  },
];
export const addLoanTermScenarios: {
  id: string;
  hasRequest: boolean;
  hasTerm: boolean;
  linked?: boolean;
  neighbors?: boolean;
  rejectObligation?: 'P01' | 'P02';
}[] = [
  {id: 'dev-term-empty-links', hasRequest: true, hasTerm: true},
  {id: 'dev-term-with-neighbor', hasRequest: true, hasTerm: true, neighbors: true},
  {id: 'dev-term-already-linked', hasRequest: true, hasTerm: true, linked: true},
  {id: 'dev-term-missing-request', hasRequest: false, hasTerm: true, rejectObligation: 'P01'},
  {id: 'dev-term-missing-term', hasRequest: true, hasTerm: false, rejectObligation: 'P02'},
  {id: 'dev-term-both-missing', hasRequest: false, hasTerm: false, rejectObligation: 'P01'},
];
