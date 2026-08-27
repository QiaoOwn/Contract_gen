import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/queryBankCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('Happy Path: returns the referenced card', () => {
    const service = new ManageBankCardCRUDService();
    const card = new BankCard();
    card.CardID = 1;
    card.Password = 123;
    getRepository(BankCard).push(card);
    const result = service.queryBankCard(card.CardID);
    expect(result).toBe(card);
  });

  it('rejects when card does not exist', () => {
    const service = new ManageBankCardCRUDService();
    expectPreconditionRejected(() => service.queryBankCard(99));
  });
});
