import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/printReceipt', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  const seed = () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Balance = 9999;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    return service;
  };

  it('Happy Path: returns withdrawn amount after withdrawal', () => {
    const service = seed();
    service.IsWithdraw = true;
    service.WithdrawedNumber = 100;
    expect(service.printReceipt()).toBe(100);
  });

  it('returns deposited amount after deposit', () => {
    const service = seed();
    service.IsDeposit = true;
    service.DepositedNumber = 200;
    expect(service.printReceipt()).toBe(200);
  });

  it('returns zero when neither withdraw nor deposit occurred', () => {
    const service = seed();
    service.IsWithdraw = false;
    service.IsDeposit = false;
    expect(service.printReceipt()).toBe(0);
  });

  it('rejects when card identifier is not validated', () => {
    const service = seed();
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.printReceipt());
  });

  it('rejects when password is not validated', () => {
    const service = seed();
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.printReceipt());
  });

  it('rejects when current card is missing', () => {
    const service = new AutomatedTellerMachineSystem();
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    expectPreconditionRejected(() => service.printReceipt());
  });
});
