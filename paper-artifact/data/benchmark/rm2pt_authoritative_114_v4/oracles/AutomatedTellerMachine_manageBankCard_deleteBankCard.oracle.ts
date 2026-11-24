import {BankCard, getRepository, ManageBankCardCRUDService} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageBankCardCRUDService/deleteBankCard', () => {
  beforeEach(() => clearRepositories(getRepository(BankCard)));

  it('removes the selected BankCard, preserves its neighbor identity, and returns true', () => {
    const target = Object.assign(new BankCard(), {CardID: 1, Password: 123});
    const neighbor = Object.assign(new BankCard(), {CardID: 2, Password: 456});
    getRepository(BankCard).push(target, neighbor);
    expect(new ManageBankCardCRUDService().deleteBankCard(1)).toBe(true);
    expect(getRepository(BankCard)).toEqual([neighbor]);
  });

  it('rejects a missing ID without removing another BankCard', () => {
    const neighbor = Object.assign(new BankCard(), {CardID: 2, Password: 456});
    getRepository(BankCard).push(neighbor);
    expectPreconditionRejected(() => new ManageBankCardCRUDService().deleteBankCard(99));
    expect(getRepository(BankCard)).toEqual([neighbor]);
  });
});
