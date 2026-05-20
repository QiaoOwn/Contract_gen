import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
describe('AutomatedTellerMachine/ManageBankCardCRUDService/queryBankCard', () => {
  it('Happy Path', () => {
    const service = new ManageBankCardCRUDService();
    const card = new BankCard();
    card.CardID = 1;
    card.Password = 123;
    getRepository(BankCard).push(card);
    const result = service.queryBankCard(card.CardID);
    expect(result).toBe(card);
  });
});
