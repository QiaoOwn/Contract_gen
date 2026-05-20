import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/inputPassword', () => {
  it('Happy Path', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Password = 123;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.CardIDValidated = true;
    const result = service.inputPassword(card.Password);
    expect(result).toBe(true);
    expect(service.PasswordValidated).toBe(true);
  });
});
