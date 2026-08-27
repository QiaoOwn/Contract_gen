import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/withdrawCash', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  const seed = (balance = 9999) => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Balance = balance;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.PasswordValidated = true;
    service.CardIDValidated = true;
    return {service, card};
  };

  it('Happy Path: withdraws amount and records withdrawal state', () => {
    const {service, card} = seed(9999);
    const result = service.withdrawCash(100);
    expect(result).toBe(true);
    expect(card.Balance).toBe(9899);
    expect(service.WithdrawedNumber).toBe(100);
    expect(service.IsWithdraw).toBe(true);
  });

  it('rejects when balance is insufficient', () => {
    const {service, card} = seed(50);
    expectPreconditionRejected(() => service.withdrawCash(100));
    expect(card.Balance).toBe(50);
    expect(service.IsWithdraw).toBeUndefined();
  });

  it('rejects when session is not authenticated', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.Balance = 9999;
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.withdrawCash(100));
    expect(card.Balance).toBe(9999);
  });
});
