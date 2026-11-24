import {AutomatedTellerMachineSystem, BankCard, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned receipt branch priority and recorded amount', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (withdraw = false, deposit = false, withdrawn = 381.5, deposited = 492.75) => {
    const service = new AutomatedTellerMachineSystem();
    Object.assign(service, {InputCard: Object.assign(new BankCard(), {CardID: 3301, Password: 3311, Balance: 500}),
      CardIDValidated: true, PasswordValidated: true, IsWithdraw: withdraw, IsDeposit: deposit,
      WithdrawedNumber: withdrawn, DepositedNumber: deposited});
    return service;
  };
  it('returns the withdrawal amount when only withdrawal is recorded', () => {
    expect(seed(true).printReceipt()).toBe(381.5);
  });
  it('returns the deposit amount when only deposit is recorded', () => {
    expect(seed(false, true).printReceipt()).toBe(492.75);
  });
  it('gives withdrawal priority when both flags are true', () => {
    expect(seed(true, true, 719.25, 880.5).printReceipt()).toBe(719.25);
  });
  it('returns zero when neither flag is true despite stored amounts', () => {
    expect(seed(false, false).printReceipt()).toBe(0);
  });
  it('returns a recorded zero withdrawal instead of a nonzero deposit', () => {
    expect(seed(true, true, 0, 611).printReceipt()).toBe(0);
  });
  it('returns a recorded zero deposit when withdrawal is false', () => {
    expect(seed(false, true, 527, 0).printReceipt()).toBe(0);
  });
  it('rejects an unvalidated card identifier', () => {
    const service = seed(); service.CardIDValidated = false;
    expectPreconditionRejected(() => service.printReceipt());
  });
  it('rejects an unvalidated password', () => {
    const service = seed(); service.PasswordValidated = false;
    expectPreconditionRejected(() => service.printReceipt());
  });
  it('rejects an absent current card', () => {
    const service = seed(); service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.printReceipt());
  });
});
