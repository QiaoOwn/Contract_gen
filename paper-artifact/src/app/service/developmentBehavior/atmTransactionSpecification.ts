import type {DevelopmentObligation} from './types';
import type {FiniteScenario} from './finiteScenarioReport';
import {atmInputCardSources} from './atmInputCardSpecification';
import {atmEjectCardObligations, atmEjectCardScenarios} from './atmEjectCardSpecification';

export const ATM_TRANSACTION_KEYS = ['receipt-deposit', 'receipt-withdraw', 'eject-deposit', 'eject-withdraw', 'withdraw'] as const;
export type AtmTransactionKey = typeof ATM_TRANSACTION_KEYS[number];
export const atmTransactionSources = atmInputCardSources.map(source => ({...source,
  note: source.id === 'requirement-document' ? 'OP3 printReceipt 766/770; OP5 ejectCard 902/906; OP6 withdrawCash 975/979. One upstream specification family.'
    : 'Active contracts 307-344, 369-402 and 405-432. Preserve receipt branch priority and exact session effects; no cascade, frame or extra amount-domain condition is inferred.'}));
atmTransactionSources.push({id: 'verification-decision',
  path: 'data/operation_revision/verification_decisions/withdrawCash_nonpositive.json',
  sha256: '65c63915149ddbefd52f342215141fea45bec73eb7b41314df9493a615fbada1',
  note: 'Requirement owner approved source-preserving zero/negative withdrawal boundary checks; original model and frozen input remain unchanged.'});
const obligation = (id: string, requirement: string, documentLine: number,
  modelLines: [number, number], modelFeatures: string[]): DevelopmentObligation => ({
  id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement, documentLine, modelLines, modelFeatures,
});
const receiptObligations = [
  obligation('P01', 'Card-identifier validation is true.', 766, [316, 316], ['self.CardIDValidated']),
  obligation('P02', 'Password validation is true.', 766, [317, 317], ['self.PasswordValidated']),
  obligation('P03', 'A current BankCard exists.', 766, [318, 318], ['self.InputCard']),
  obligation('Q01', 'When the withdrawal flag is true, return the recorded withdrawal amount, including when the deposit flag is also true.', 770, [332, 334], ['self.IsWithdraw', 'self.WithdrawedNumber', '$result']),
  obligation('Q02', 'When withdrawal is false and deposit is true, return the recorded deposit amount.', 770, [332, 339], ['self.IsWithdraw', 'self.IsDeposit', 'self.DepositedNumber', '$result']),
  obligation('Q03', 'When neither flag is true, return zero.', 770, [332, 341], ['self.IsWithdraw', 'self.IsDeposit', '$result']),
];
const withdrawObligations = [
  obligation('P01', 'Password validation is true.', 975, [415, 415], ['self.PasswordValidated']),
  obligation('P02', 'Card-identifier validation is true.', 975, [416, 416], ['self.CardIDValidated']),
  obligation('P03', 'A current BankCard exists.', 975, [417, 417], ['self.InputCard']),
  obligation('P04', 'The current card balance is at least the requested quantity.', 975, [418, 418], ['self.InputCard', 'BankCard.Balance', '$parameter.quantity']),
  obligation('Q01', 'The card balance becomes its operation-entry balance minus quantity.', 979, [428, 428], ['self.InputCard', 'BankCard.Balance', '$parameter.quantity']),
  obligation('Q02', 'The recorded withdrawal amount equals quantity.', 979, [429, 429], ['self.WithdrawedNumber', '$parameter.quantity']),
  obligation('Q03', 'The withdrawal flag becomes true.', 979, [430, 430], ['self.IsWithdraw']),
  obligation('Q04', 'The successful operation returns true.', 979, [431, 431], ['$result']),
];
export const atmTransactionSpecifications = {
  'receipt-deposit': {id: 'AutomatedTellerMachine_depositFunds_printReceipt', useCase: 'depositFunds', operation: 'printReceipt', obligations: receiptObligations},
  'receipt-withdraw': {id: 'AutomatedTellerMachine_withdrawCash_printReceipt', useCase: 'withdrawCash', operation: 'printReceipt', obligations: receiptObligations},
  'eject-deposit': {id: 'AutomatedTellerMachine_depositFunds_ejectCard', useCase: 'depositFunds', operation: 'ejectCard', obligations: atmEjectCardObligations},
  'eject-withdraw': {id: 'AutomatedTellerMachine_withdrawCash_ejectCard', useCase: 'withdrawCash', operation: 'ejectCard', obligations: atmEjectCardObligations},
  withdraw: {id: 'AutomatedTellerMachine_withdrawCash_withdrawCash', useCase: 'withdrawCash', operation: 'withdrawCash', obligations: withdrawObligations},
} as const;
export type AtmTransactionScenario = FiniteScenario & {
  passwordValidated?: boolean; cardValidated?: boolean; missingCard?: boolean;
  isWithdraw?: boolean; isDeposit?: boolean; withdrawn?: number; deposited?: number;
  quantity?: number; balance?: number;
};
export function atmTransactionScenarios(key: AtmTransactionKey): AtmTransactionScenario[] {
  const spec = atmTransactionSpecifications[key], all = spec.obligations.map(item => item.id);
  if (spec.operation === 'ejectCard') return [
    ...atmEjectCardScenarios.map(item => ({id: item.id, obligationIds: item.rejectObligation ? [item.rejectObligation] : all,
      rejectObligation: item.rejectObligation, passwordValidated: item.passwordValidated, cardValidated: item.cardIdValidated,
      missingCard: !item.hasCard, isWithdraw: item.isWithdraw, isDeposit: item.isDeposit,
      withdrawn: item.withdrawn, deposited: item.deposited})),
    {id: 'dev-eject-both-flags-and-amounts', obligationIds: all, isWithdraw: true, isDeposit: true, withdrawn: 478, deposited: 681.25},
  ];
  const auth = (id: string): AtmTransactionScenario => ({id: `dev-${key}-${id}`, obligationIds: [id], rejectObligation: id,
    ...(id === 'P03' ? {missingCard: true} : spec.operation === 'printReceipt'
      ? id === 'P01' ? {cardValidated: false} : {passwordValidated: false}
      : id === 'P01' ? {passwordValidated: false} : {cardValidated: false})});
  if (spec.operation === 'printReceipt') {
    const receipt = (id: string, w: boolean, d: boolean, withdrawn: number, deposited: number): AtmTransactionScenario => ({
      id, obligationIds: ['P01', 'P02', 'P03', w ? 'Q01' : d ? 'Q02' : 'Q03'], isWithdraw: w, isDeposit: d, withdrawn, deposited});
    return [receipt('dev-receipt-withdrawal', true, false, 127.75, 582.25),
      receipt('dev-receipt-deposit', false, true, 922.5, 425.5),
      receipt('dev-receipt-both-flags', true, true, 91.25, 606.75),
      receipt('dev-receipt-neither-flag', false, false, 251, 388),
      receipt('dev-receipt-zero-withdrawal', true, true, 0, 901),
      receipt('dev-receipt-zero-deposit', false, true, 971, 0), auth('P01'), auth('P02'), auth('P03')];
  }
  return [
    {id: 'dev-withdraw-positive', obligationIds: all, balance: 932.75, quantity: 125},
    {id: 'dev-withdraw-exact-balance', obligationIds: all, balance: 500, quantity: 500},
    {id: 'dev-withdraw-fractional-balance', obligationIds: all, balance: 225.5, quantity: 100},
    {id: 'dev-withdraw-varied-amount', obligationIds: all, balance: 725, quantity: 371},
    {id: 'dev-withdraw-zero', obligationIds: all, balance: 0, quantity: 0},
    {id: 'dev-withdraw-negative', obligationIds: all, balance: 31.5, quantity: -25},
    {id: 'dev-withdraw-insufficient', obligationIds: ['P04'], balance: 99.75, quantity: 100, rejectObligation: 'P04'},
    auth('P01'), auth('P02'), auth('P03'),
  ];
}
