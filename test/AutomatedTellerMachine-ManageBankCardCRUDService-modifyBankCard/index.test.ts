import {BankCard, CardCatalog, CardStatus, getRepository, ManageBankCardCRUDService} from './entry';
describe('AutomatedTellerMachine/ManageBankCardCRUDService/modifyBankCard', () => {
  it('Happy Path', () => {
    const service = new ManageBankCardCRUDService();
    const card = new BankCard();
    card.CardID = 1;
    card.Password = 123;
    getRepository(BankCard).push(card);
    const result = service.modifyBankCard(
      card.CardID,
      CardStatus.NORMAL,
      CardCatalog.CREDIT,
      111111,
      9999
    );
    expect(result).toBe(true);
    expect(card.CardStatus).toBe(CardStatus.NORMAL);
    expect(card.Catalog).toBe(CardCatalog.CREDIT);
    expect(card.Password).toBe(111111);
    expect(card.Balance).toBe(9999);
  });
});
