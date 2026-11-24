import {BankCard, CardCatalog, CardStatus, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/modifyBankCard', () => {
  beforeEach(() => clearRepositories(getRepository(BankCard)));

  it('updates only the selected BankCard five fields and returns true', () => {
    const target = Object.assign(new BankCard(), {
      CardID: 1,
      CardStatus: CardStatus.SUSPEND,
      Catalog: CardCatalog.DESPOSIT,
      Password: 123,
      Balance: 10,
    });
    const neighbor = Object.assign(new BankCard(), {
      CardID: 2,
      CardStatus: CardStatus.CANNEL,
      Catalog: CardCatalog.CREDIT,
      Password: 456,
      Balance: 20,
    });
    getRepository(BankCard).push(target, neighbor);
    expect(
      new ManageBankCardCRUDService().modifyBankCard(
        1,
        CardStatus.NORMAL,
        CardCatalog.CREDIT,
        111111,
        9999
      )
    ).toBe(true);
    expect(getRepository(BankCard)).toEqual([target, neighbor]);
    expect(target.CardID).toBe(1);
    expect(target.CardStatus).toBe(CardStatus.NORMAL);
    expect(target.Catalog).toBe(CardCatalog.CREDIT);
    expect(target.Password).toBe(111111);
    expect(target.Balance).toBe(9999);
    expect(neighbor.CardID).toBe(2);
    expect(neighbor.CardStatus).toBe(CardStatus.CANNEL);
    expect(neighbor.Catalog).toBe(CardCatalog.CREDIT);
    expect(neighbor.Password).toBe(456);
    expect(neighbor.Balance).toBe(20);
  });

  it('rejects a missing ID without changing another BankCard', () => {
    const neighbor = Object.assign(new BankCard(), {
      CardID: 2,
      CardStatus: CardStatus.SUSPEND,
      Catalog: CardCatalog.DESPOSIT,
      Password: 456,
      Balance: 20,
    });
    getRepository(BankCard).push(neighbor);
    expectPreconditionRejected(() =>
      new ManageBankCardCRUDService().modifyBankCard(
        99,
        CardStatus.NORMAL,
        CardCatalog.CREDIT,
        111111,
        9999
      )
    );
    expect(getRepository(BankCard)).toEqual([neighbor]);
    expect(neighbor.CardStatus).toBe(CardStatus.SUSPEND);
    expect(neighbor.Catalog).toBe(CardCatalog.DESPOSIT);
    expect(neighbor.Password).toBe(456);
    expect(neighbor.Balance).toBe(20);
  });
});
