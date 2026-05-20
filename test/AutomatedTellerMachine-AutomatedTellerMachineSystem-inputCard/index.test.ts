import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository, User} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/inputCard', () => {
  it('Happy Path', () => {
    const service = new AutomatedTellerMachineSystem();
    const user = new User();
    user.UserID = 1;
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.BelongedUser = user;
    user.OwnedCard = card;
    getRepository(User).push(user);
    getRepository(BankCard).push(card);
    const result = service.inputCard(card.CardID);
    expect(result).toBe(true);
    expect(service.CardIDValidated).toBe(true);
    expect(service.InputCard).toBe(card);
  });
});
