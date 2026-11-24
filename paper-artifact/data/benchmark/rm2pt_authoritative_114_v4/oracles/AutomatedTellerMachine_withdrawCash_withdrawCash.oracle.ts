import {AutomatedTellerMachineSystem, BankCard, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned withdrawal balance and session effects', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (balance = 580.75) => {
    const service = new AutomatedTellerMachineSystem();
    const card = Object.assign(new BankCard(), {CardID: 5501, Password: 5511, Balance: balance});
    Object.assign(service, {InputCard: card, CardIDValidated: true, PasswordValidated: true,
      IsWithdraw: false, WithdrawedNumber: 919});
    return {service, card};
  };
  const expectUnchanged = (service: AutomatedTellerMachineSystem, card: BankCard, balance: number) => {
    expect(card.Balance).toBe(balance);
    expect(service.WithdrawedNumber).toBe(919);
    expect(service.IsWithdraw).toBe(false);
  };
  it.each([{balance: 580.75, amount: 120}, {balance: 350, amount: 350},
    {balance: 225.25, amount: 100}, {balance: 960, amount: 427},
    {balance: 0, amount: 0}, {balance: 82.25, amount: -17}])(
    'deducts $amount from prior balance $balance and records the withdrawal', ({balance, amount}) => {
      const {service, card} = seed(balance);
      expect(service.withdrawCash(amount)).toBe(true);
      expect(card.Balance).toBe(balance - amount);
      expect(service.WithdrawedNumber).toBe(amount);
      expect(service.IsWithdraw).toBe(true);
    });
  it('rejects an amount just above the available balance', () => {
    const {service, card} = seed(99.75);
    expectPreconditionRejected(() => service.withdrawCash(100));
    expectUnchanged(service, card, 99.75);
  });
  it('rejects an unvalidated password', () => {
    const {service, card} = seed(); service.PasswordValidated = false;
    expectPreconditionRejected(() => service.withdrawCash(100));
    expectUnchanged(service, card, 580.75);
  });
  it('rejects an unvalidated card identifier', () => {
    const {service, card} = seed(); service.CardIDValidated = false;
    expectPreconditionRejected(() => service.withdrawCash(100));
    expectUnchanged(service, card, 580.75);
  });
  it('rejects an absent current card', () => {
    const {service, card} = seed(); service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.withdrawCash(100));
    expectUnchanged(service, card, 580.75);
  });
});
