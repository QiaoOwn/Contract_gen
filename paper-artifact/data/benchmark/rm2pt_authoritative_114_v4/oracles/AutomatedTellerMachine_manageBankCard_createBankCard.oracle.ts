import {BankCard, CardCatalog, CardStatus, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/createBankCard', () => {
  beforeEach(() => clearRepositories(getRepository(BankCard)));

  it('creates exactly one stored BankCard with the supplied fields', () => {
    const neighbor = Object.assign(new BankCard(), {
      CardID: 2,
      CardStatus: CardStatus.SUSPEND,
      Catalog: CardCatalog.DESPOSIT,
      Password: 222222,
      Balance: 50,
    });
    getRepository(BankCard).push(neighbor);
    expect(
      new ManageBankCardCRUDService().createBankCard(
        1,
        CardStatus.NORMAL,
        CardCatalog.CREDIT,
        111111,
        9999
      )
    ).toBe(true);
    const created = getRepository(BankCard).filter(item => item !== neighbor);
    expect(getRepository(BankCard)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(BankCard);
    expect(created[0].CardID).toBe(1);
    expect(created[0].CardStatus).toBe(CardStatus.NORMAL);
    expect(created[0].Catalog).toBe(CardCatalog.CREDIT);
    expect(created[0].Password).toBe(111111);
    expect(created[0].Balance).toBe(9999);
    expect(getRepository(BankCard)).toContain(neighbor);
  });

  it('rejects a reused identifier without adding or replacing a BankCard', () => {
    const existing = Object.assign(new BankCard(), {
      CardID: 1,
      CardStatus: CardStatus.SUSPEND,
      Catalog: CardCatalog.DESPOSIT,
      Password: 123456,
      Balance: 42,
    });
    getRepository(BankCard).push(existing);
    expectPreconditionRejected(() =>
      new ManageBankCardCRUDService().createBankCard(
        1,
        CardStatus.NORMAL,
        CardCatalog.CREDIT,
        111111,
        9999
      )
    );
    expect(getRepository(BankCard)).toEqual([existing]);
    expect(existing.CardStatus).toBe(CardStatus.SUSPEND);
    expect(existing.Catalog).toBe(CardCatalog.DESPOSIT);
    expect(existing.Password).toBe(123456);
    expect(existing.Balance).toBe(42);
  });
});
