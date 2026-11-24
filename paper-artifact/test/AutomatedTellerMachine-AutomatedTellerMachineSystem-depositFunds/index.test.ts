import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/depositFunds', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  const seed = (balance = 1000) => {
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

  it('Happy Path: deposits amount and records deposit state', () => {
    const {service, card} = seed(1000);
    const result = service.depositFunds(100);
    expect(result).toBe(true);
    expect(card.Balance).toBe(1100);
    expect(service.IsDeposit).toBe(true);
    expect(service.DepositedNumber).toBe(100);
  });

  it('rejects when deposit amount is below 100', () => {
    const {service, card} = seed(1000);
    expectPreconditionRejected(() => service.depositFunds(50));
    expect(card.Balance).toBe(1000);
    expect(service.IsDeposit).toBeUndefined();
  });

  it('rejects when session is not authenticated', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.Balance = 1000;
    service.InputCard = card;
    service.CardIDValidated = false;
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.depositFunds(100));
    expect(card.Balance).toBe(1000);
  });
});
