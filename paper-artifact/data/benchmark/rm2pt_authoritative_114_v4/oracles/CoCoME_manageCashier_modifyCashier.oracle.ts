import {Cashier, ManageCashierCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageCashierCRUDService/modifyCashier', () => {
  beforeEach(() => clearRepositories(getRepository(Cashier)));
  it('updates the selected Cashier and leaves a neighbor unchanged', () => {
    const target = Object.assign(new Cashier(), {Id: 1, Name: 'old'});
    const neighbor = Object.assign(new Cashier(), {Id: 2, Name: 'neighbor'});
    getRepository(Cashier).push(neighbor, target);
    expect(new ManageCashierCRUDService().modifyCashier(1, 'new')).toBe(true);
    expect(getRepository(Cashier)).toEqual([neighbor, target]);
    expect(target.Id).toBe(1);
    expect(target.Name).toBe('new');
    expect(neighbor.Name).toBe('neighbor');
  });
  it('rejects a missing Cashier without changing the repository', () => {
    const neighbor = Object.assign(new Cashier(), {Id: 2, Name: 'neighbor'});
    getRepository(Cashier).push(neighbor);
    expectPreconditionRejected(() => new ManageCashierCRUDService().modifyCashier(99, 'new'));
    expect(getRepository(Cashier)).toEqual([neighbor]);
    expect(neighbor.Name).toBe('neighbor');
  });
});
