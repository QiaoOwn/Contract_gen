import {Cashier, ManageCashierCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageCashierCRUDService/createCashier', () => {
  beforeEach(() => clearRepositories(getRepository(Cashier)));
  it('creates exactly one stored Cashier with the supplied ID and name', () => {
    const neighbor = Object.assign(new Cashier(), {Id: 2, Name: 'neighbor'});
    getRepository(Cashier).push(neighbor);
    expect(new ManageCashierCRUDService().createCashier(1, 'test')).toBe(true);
    const created = getRepository(Cashier).filter(item => item !== neighbor);
    expect(getRepository(Cashier)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Cashier);
    expect(created[0].Id).toBe(1);
    expect(created[0].Name).toBe('test');
    expect(getRepository(Cashier)).toContain(neighbor);
  });
  it('rejects a duplicate ID without creating or replacing a Cashier', () => {
    const existing = Object.assign(new Cashier(), {Id: 1, Name: 'original'});
    getRepository(Cashier).push(existing);
    expectPreconditionRejected(() => new ManageCashierCRUDService().createCashier(1, 'test'));
    expect(getRepository(Cashier)).toEqual([existing]);
    expect(existing.Name).toBe('original');
  });
});
