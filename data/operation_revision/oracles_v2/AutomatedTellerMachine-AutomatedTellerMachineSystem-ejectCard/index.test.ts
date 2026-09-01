import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/ejectCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('Happy Path: clears session and transaction state', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Password = 123;
    card.Balance = 9999;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    service.IsWithdraw = true;
    service.IsDeposit = true;
    service.WithdrawedNumber = 50;
    service.DepositedNumber = 100;
    const result = service.ejectCard();
    expect(result).toBe(true);
    expect(service.InputCard).toBeUndefined();
    expect(service.CardIDValidated).toBe(false);
    expect(service.PasswordValidated).toBe(false);
    expect(service.IsWithdraw).toBe(false);
    expect(service.IsDeposit).toBe(false);
    expect(service.WithdrawedNumber).toBe(0);
    expect(service.DepositedNumber).toBe(0);
  });

  it('rejects when session is not authenticated', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    service.InputCard = card;
    service.CardIDValidated = false;
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.InputCard).toBe(card);
  });
});
