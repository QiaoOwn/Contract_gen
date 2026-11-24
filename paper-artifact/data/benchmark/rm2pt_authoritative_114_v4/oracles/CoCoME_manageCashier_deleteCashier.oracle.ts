import {Cashier, ManageCashierCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageCashierCRUDService/deleteCashier', () => {
  beforeEach(() => clearRepositories(getRepository(Cashier)));
  it('removes only the selected Cashier and returns true', () => {
    const target = Object.assign(new Cashier(), {Id: 1});
    const survivor = Object.assign(new Cashier(), {Id: 2});
    getRepository(Cashier).push(target, survivor);
    expect(new ManageCashierCRUDService().deleteCashier(1)).toBe(true);
    expect(getRepository(Cashier)).toEqual([survivor]);
  });
  it('rejects a missing Cashier without removing another Cashier', () => {
    const survivor = Object.assign(new Cashier(), {Id: 2});
    getRepository(Cashier).push(survivor);
    expectPreconditionRejected(() => new ManageCashierCRUDService().deleteCashier(99));
    expect(getRepository(Cashier)).toEqual([survivor]);
  });
});
