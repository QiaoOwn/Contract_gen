import {BankCard, CardCatalog, CardStatus, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/modifyBankCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('Happy Path: updates card fields', () => {
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

  it('rejects when card does not exist', () => {
    const service = new ManageBankCardCRUDService();
    expectPreconditionRejected(() =>
      service.modifyBankCard(99, CardStatus.NORMAL, CardCatalog.CREDIT, 111111, 9999)
    );
    expect(getRepository(BankCard)).toHaveLength(0);
  });
});
