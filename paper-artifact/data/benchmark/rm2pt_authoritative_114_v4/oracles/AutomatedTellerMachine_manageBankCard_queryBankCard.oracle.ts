import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/queryBankCard', () => {
  beforeEach(() => clearRepositories(getRepository(BankCard)));

  it('returns the card with the requested id among multiple cards', () => {
    const other = Object.assign(new BankCard(), {CardID: 17, Password: 1});
    const card = Object.assign(new BankCard(), {CardID: 41, Password: 123});
    getRepository(BankCard).push(other, card);
    expect(new ManageBankCardCRUDService().queryBankCard(card.CardID)).toBe(card);
  });

  it('returns a non-first target when earlier cards exist', () => {
    const first = Object.assign(new BankCard(), {CardID: 10});
    const second = Object.assign(new BankCard(), {CardID: 11});
    const target = Object.assign(new BankCard(), {CardID: 12});
    getRepository(BankCard).push(first, second, target);
    expect(new ManageBankCardCRUDService().queryBankCard(12)).toBe(target);
  });

  it('rejects when card does not exist among other cards', () => {
    const other = Object.assign(new BankCard(), {CardID: 17});
    getRepository(BankCard).push(other);
    expectPreconditionRejected(() => new ManageBankCardCRUDService().queryBankCard(99));
    expect(getRepository(BankCard)).toEqual([other]);
  });

  it('rejects when the card repository is empty', () => {
    expectPreconditionRejected(() => new ManageBankCardCRUDService().queryBankCard(99));
    expect(getRepository(BankCard)).toHaveLength(0);
  });
});
