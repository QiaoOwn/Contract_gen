import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/deleteBankCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('Happy Path: removes card from repository', () => {
    const service = new ManageBankCardCRUDService();
    const card = new BankCard();
    card.CardID = 1;
    card.Password = 123;
    getRepository(BankCard).push(card);
    const result = service.deleteBankCard(card.CardID);
    expect(result).toBe(true);
    expect(getRepository(BankCard)).toHaveLength(0);
  });

  it('rejects when card does not exist', () => {
    const service = new ManageBankCardCRUDService();
    expectPreconditionRejected(() => service.deleteBankCard(99));
    expect(getRepository(BankCard)).toHaveLength(0);
  });
});
