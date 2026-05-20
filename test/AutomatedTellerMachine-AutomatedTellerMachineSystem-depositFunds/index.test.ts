import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/depositFunds', () => {
  it('Happy Path', () => {
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
    const result = service.depositFunds(101);
    expect(result).toBe(true);
    expect(card.Balance).toBe(10100);
    expect(service.IsDeposit).toBe(true);
    expect(service.DepositedNumber).toBe(101);
  });
});
