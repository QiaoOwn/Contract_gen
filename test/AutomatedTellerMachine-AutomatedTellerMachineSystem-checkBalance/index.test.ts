import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/checkBalance', () => {
  it('Happy Path', () => {
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
    expect(service.InputCard).toBe(card);
    expect(service.PasswordValidated).toBe(true);
    expect(service.CardIDValidated).toBe(true);
  });
});
