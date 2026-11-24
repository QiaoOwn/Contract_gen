import {ManageSupplierCRUDService, Supplier, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageSupplierCRUDService/deleteSupplier', () => {
  beforeEach(() => clearRepositories(getRepository(Supplier)));

  it('removes exactly the selected Supplier and returns true', () => {
    const target = Object.assign(new Supplier(), {Id: 1});
    const survivor = Object.assign(new Supplier(), {Id: 2});
    getRepository(Supplier).push(target, survivor);
    expect(new ManageSupplierCRUDService().deleteSupplier(1)).toBe(true);
    expect(getRepository(Supplier)).toEqual([survivor]);
  });

  it('rejects a missing Supplier without removing another one', () => {
    const survivor = Object.assign(new Supplier(), {Id: 2});
    getRepository(Supplier).push(survivor);
    expectPreconditionRejected(() => new ManageSupplierCRUDService().deleteSupplier(99));
    expect(getRepository(Supplier)).toEqual([survivor]);
  });
});
