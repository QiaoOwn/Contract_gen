import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
describe('AutomatedTellerMachine/ManageBankCardCRUDService/deleteBankCard', () => {
  it('Happy Path', () => {
    const service = new ManageBankCardCRUDService();
    const card = new BankCard();
    card.CardID = 1;
    card.Password = 123;
    getRepository(BankCard).push(card);
    const result = service.deleteBankCard(card.CardID);
    expect(result).toBe(true);
    expect(getRepository(BankCard).length).toBe(0);
  });
});
