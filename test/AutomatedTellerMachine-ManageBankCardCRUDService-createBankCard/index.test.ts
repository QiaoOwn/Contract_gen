import {BankCard, CardCatalog, CardStatus, getRepository, ManageBankCardCRUDService} from './entry';
describe('AutomatedTellerMachine/ManageBankCardCRUDService/createBankCard', () => {
  it('Happy Path', () => {
    const service = new ManageBankCardCRUDService();
    const result = service.createBankCard(1, CardStatus.NORMAL, CardCatalog.CREDIT, 111111, 9999);
    expect(result).toBe(true);
    expect(getRepository(BankCard).find((e) => e.CardID === 1)).toBeDefined();
  });
});
