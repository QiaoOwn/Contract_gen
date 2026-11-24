import {BankCard, CardCatalog, CardStatus, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/createBankCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('Happy Path: creates bank card with supplied fields', () => {
    const service = new ManageBankCardCRUDService();
    const result = service.createBankCard(1, CardStatus.NORMAL, CardCatalog.CREDIT, 111111, 9999);
    expect(result).toBe(true);
    const card = getRepository(BankCard).find((e) => e.CardID === 1);
    expect(card).toBeDefined();
    expect(card?.CardStatus).toBe(CardStatus.NORMAL);
    expect(card?.Catalog).toBe(CardCatalog.CREDIT);
    expect(card?.Password).toBe(111111);
    expect(card?.Balance).toBe(9999);
  });

  it('rejects when card identifier is already used', () => {
    const existing = new BankCard();
    existing.CardID = 1;
    getRepository(BankCard).push(existing);
    const service = new ManageBankCardCRUDService();
    expectPreconditionRejected(() =>
      service.createBankCard(1, CardStatus.NORMAL, CardCatalog.CREDIT, 111111, 9999)
    );
    expect(getRepository(BankCard)).toHaveLength(1);
    expect(getRepository(BankCard)[0]).toBe(existing);
  });
});
