import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/queryBankCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  it('returns the card with the requested id among multiple cards', () => {
    const service = new ManageBankCardCRUDService();
    const other = new BankCard();
    other.CardID = 17;
    const card = new BankCard();
    card.CardID = 41;
    card.Password = 123;
    getRepository(BankCard).push(other, card);
    const result = service.queryBankCard(card.CardID);
    expect(result).toBe(card);
  });

  it('rejects when card does not exist', () => {
    const service = new ManageBankCardCRUDService();
    const other = new BankCard();
    other.CardID = 17;
    getRepository(BankCard).push(other);
    expectPreconditionRejected(() => service.queryBankCard(99));
  });
});
