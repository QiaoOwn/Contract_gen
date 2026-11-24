import {ManageSupplierCRUDService, Supplier, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageSupplierCRUDService/modifySupplier', () => {
  beforeEach(() => clearRepositories(getRepository(Supplier)));

  it('updates only the selected stored Supplier and returns true', () => {
    const target = Object.assign(new Supplier(), {Id: 1, Name: 'old'});
    const neighbor = Object.assign(new Supplier(), {Id: 2, Name: 'neighbor'});
    getRepository(Supplier).push(neighbor, target);
    expect(new ManageSupplierCRUDService().modifySupplier(1, 'new')).toBe(true);
    expect(getRepository(Supplier)).toEqual([neighbor, target]);
    expect(target.Id).toBe(1);
    expect(target.Name).toBe('new');
    expect(neighbor.Name).toBe('neighbor');
  });

  it('rejects a missing Supplier without mutating the repository', () => {
    const neighbor = Object.assign(new Supplier(), {Id: 2, Name: 'neighbor'});
    getRepository(Supplier).push(neighbor);
    expectPreconditionRejected(() => new ManageSupplierCRUDService().modifySupplier(99, 'new'));
    expect(getRepository(Supplier)).toEqual([neighbor]);
    expect(neighbor.Name).toBe('neighbor');
  });
});
