import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/checkBalance', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('Happy Path: returns current card balance without changing it', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Password = 123;
    card.Balance = 9999;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.PasswordValidated = true;
    service.CardIDValidated = true;
    const result = service.checkBalance();
    expect(result).toBe(9999);
    expect(card.Balance).toBe(9999);
    expect(service.InputCard).toBe(card);
    expect(service.PasswordValidated).toBe(true);
    expect(service.CardIDValidated).toBe(true);
  });

  it('rejects when password is not validated', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.Balance = 9999;
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.checkBalance());
    expect(card.Balance).toBe(9999);
  });

  it('rejects when current card is missing', () => {
    const service = new AutomatedTellerMachineSystem();
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    expectPreconditionRejected(() => service.checkBalance());
  });
});
