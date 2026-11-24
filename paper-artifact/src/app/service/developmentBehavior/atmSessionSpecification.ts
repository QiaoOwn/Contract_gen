import type {DevelopmentObligation} from './types';
import type {FiniteScenario} from './finiteScenarioReport';
import {atmInputCardSources} from './atmInputCardSpecification';

export const ATM_SESSION_KEYS = ['password-check', 'password-deposit', 'password-withdraw', 'balance', 'deposit'] as const;
export type AtmSessionKey = typeof ATM_SESSION_KEYS[number];
export const atmSessionSources = atmInputCardSources.map(source => ({...source,
  note: source.id === 'requirement-document'
    ? 'OP2 inputPassword (696/700), OP4 checkBalance (843/847), OP7 depositFunds (1042/1046); one upstream source family.'
    : 'Active contracts at 274-304, 347-366 and 435-462. No repository-membership, card-status, password-domain or whole-system frame guard is added.'}));
const obligation = (id: string, requirement: string, documentLine: number,
  modelLines: [number, number], modelFeatures: string[]): DevelopmentObligation => ({
  id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement,
  documentLine, modelLines, modelFeatures,
});
const passwordObligations = [
  obligation('P01', 'Card-identifier validation is true.', 696, [282, 282], ['self.CardIDValidated']),
  obligation('P02', 'A current BankCard exists.', 696, [283, 283], ['self.InputCard']),
  obligation('Q01', 'A matching password sets password validation to true.', 700, [296, 298], ['self.InputCard', 'BankCard.Password', '$parameter.password', 'self.PasswordValidated']),
  obligation('Q02', 'A matching password returns true.', 700, [296, 299], ['self.InputCard', 'BankCard.Password', '$parameter.password', '$result']),
  obligation('Q03', 'A nonmatching password sets password validation to false.', 700, [296, 301], ['self.InputCard', 'BankCard.Password', '$parameter.password', 'self.PasswordValidated']),
  obligation('Q04', 'A nonmatching password returns false.', 700, [296, 302], ['self.InputCard', 'BankCard.Password', '$parameter.password', '$result']),
];
const auth = (doc: number, lines: number): DevelopmentObligation[] => [
  obligation('P01', 'Password validation is true.', doc, [lines, lines], ['self.PasswordValidated']),
  obligation('P02', 'Card-identifier validation is true.', doc, [lines + 1, lines + 1], ['self.CardIDValidated']),
  obligation('P03', 'A current BankCard exists.', doc, [lines + 2, lines + 2], ['self.InputCard']),
];
export const atmSessionSpecifications = {
  'password-check': {id: 'AutomatedTellerMachine_checkBalance_inputPassword', useCase: 'checkBalance', operation: 'inputPassword', obligations: passwordObligations},
  'password-deposit': {id: 'AutomatedTellerMachine_depositFunds_inputPassword', useCase: 'depositFunds', operation: 'inputPassword', obligations: passwordObligations},
  'password-withdraw': {id: 'AutomatedTellerMachine_withdrawCash_inputPassword', useCase: 'withdrawCash', operation: 'inputPassword', obligations: passwordObligations},
  balance: {id: 'AutomatedTellerMachine_checkBalance_checkBalance', useCase: 'checkBalance', operation: 'checkBalance', obligations: [
    ...auth(843, 356), obligation('Q01', 'Return the current card balance.', 847, [365, 365], ['self.InputCard', 'BankCard.Balance', '$result']),
  ]},
  deposit: {id: 'AutomatedTellerMachine_depositFunds_depositFunds', useCase: 'depositFunds', operation: 'depositFunds', obligations: [
    ...auth(1042, 445), obligation('P04', 'The quantity is at least 100.', 1042, [448, 448], ['$parameter.quantity']),
    obligation('Q01', 'The card balance becomes its operation-entry balance plus quantity.', 1046, [458, 458], ['self.InputCard', 'BankCard.Balance', '$parameter.quantity']),
    obligation('Q02', 'The session deposit flag becomes true.', 1046, [459, 459], ['self.IsDeposit']),
    obligation('Q03', 'The session deposited amount equals quantity.', 1046, [460, 460], ['self.DepositedNumber', '$parameter.quantity']),
    obligation('Q04', 'The successful deposit returns true.', 1046, [461, 461], ['$result']),
  ]},
} as const;
export type AtmSessionScenario = FiniteScenario & {
  cardValidated?: boolean; passwordValidated?: boolean; missingCard?: boolean;
  password?: number; entered?: number; balance?: number; quantity?: number;
};
export function atmSessionScenarios(key: AtmSessionKey): AtmSessionScenario[] {
  const spec = atmSessionSpecifications[key];
  if (spec.operation === 'inputPassword') {
    const success = (id: string, password: number, entered: number, passwordValidated: boolean): AtmSessionScenario => ({
      id, password, entered, passwordValidated,
      obligationIds: ['P01', 'P02', ...(password === entered ? ['Q01', 'Q02'] : ['Q03', 'Q04'])],
    });
    return [success('dev-password-match-from-false', 972031, 972031, false),
      success('dev-password-match-from-true', 972032, 972032, true),
      success('dev-password-mismatch-resets-true', 972033, 972034, true),
      success('dev-password-mismatch-from-false', 972035, 972036, false),
      success('dev-password-zero', 0, 0, false), success('dev-password-negative', -97, -97, false),
      {id: 'dev-password-card-not-validated', obligationIds: ['P01'], cardValidated: false, rejectObligation: 'P01'},
      {id: 'dev-password-no-card', obligationIds: ['P02'], missingCard: true, rejectObligation: 'P02'}];
  }
  const all = spec.obligations.map(item => item.id);
  const cases: AtmSessionScenario[] = spec.operation === 'checkBalance'
    ? [{id: 'dev-balance-fraction', obligationIds: all, balance: 973.75},
      {id: 'dev-balance-zero', obligationIds: all, balance: 0},
      {id: 'dev-balance-negative', obligationIds: all, balance: -43.5}]
    : [{id: 'dev-deposit-at-boundary', obligationIds: all, balance: 474.75, quantity: 100},
      {id: 'dev-deposit-fraction', obligationIds: all, balance: -20, quantity: 100.25},
      {id: 'dev-deposit-varied', obligationIds: all, balance: 0, quantity: 275.5},
      {id: 'dev-deposit-below-boundary', obligationIds: ['P04'], quantity: 99.99, rejectObligation: 'P04'},
      {id: 'dev-deposit-negative', obligationIds: ['P04'], quantity: -5, rejectObligation: 'P04'}];
  return [...cases,
    {id: `dev-${key}-password-not-validated`, obligationIds: ['P01'], passwordValidated: false, rejectObligation: 'P01'},
    {id: `dev-${key}-card-not-validated`, obligationIds: ['P02'], cardValidated: false, rejectObligation: 'P02'},
    {id: `dev-${key}-no-card`, obligationIds: ['P03'], missingCard: true, rejectObligation: 'P03'}];
}
