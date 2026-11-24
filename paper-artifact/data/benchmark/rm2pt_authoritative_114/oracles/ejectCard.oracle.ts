import {AutomatedTellerMachineSystem, BankCard, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned card ejection and session reset', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (withdraw = false, deposit = false, withdrawn = 0, deposited = 0) => {
    const service = new AutomatedTellerMachineSystem();
    Object.assign(service, {InputCard: Object.assign(new BankCard(), {CardID: 4401, Password: 4411, Balance: 600}),
      CardIDValidated: true, PasswordValidated: true, IsWithdraw: withdraw, IsDeposit: deposit,
      WithdrawedNumber: withdrawn, DepositedNumber: deposited});
    return service;
  };
  it.each([
    {withdraw: true, deposit: false, withdrawn: 311, deposited: 0},
    {withdraw: false, deposit: true, withdrawn: 0, deposited: 821.25},
    {withdraw: false, deposit: false, withdrawn: 0, deposited: 0},
    {withdraw: true, deposit: true, withdrawn: 233, deposited: 711.5},
  ])('clears every required session field for $withdraw/$deposit', values => {
    const service = seed(values.withdraw, values.deposit, values.withdrawn, values.deposited);
    expect(service.ejectCard()).toBe(true);
    expect(service.InputCard == null).toBe(true);
    expect(service.PasswordValidated).toBe(false);
    expect(service.CardIDValidated).toBe(false);
    expect(service.IsWithdraw).toBe(false);
    expect(service.IsDeposit).toBe(false);
    expect(service.WithdrawedNumber).toBe(0);
    expect(service.DepositedNumber).toBe(0);
  });
  it('rejects an unvalidated password', () => {
    const service = seed(); service.PasswordValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
  });
  it('rejects an unvalidated card identifier', () => {
    const service = seed(); service.CardIDValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
  });
  it('rejects an absent current card', () => {
    const service = seed(); service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.ejectCard());
  });
});
