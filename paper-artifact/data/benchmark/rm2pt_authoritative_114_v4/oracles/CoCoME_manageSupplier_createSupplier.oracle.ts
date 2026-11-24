import {ManageSupplierCRUDService, Supplier, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageSupplierCRUDService/createSupplier', () => {
  beforeEach(() => clearRepositories(getRepository(Supplier)));

  it('creates exactly one stored Supplier with the supplied ID and name', () => {
    const neighbor = Object.assign(new Supplier(), {Id: 2, Name: 'neighbor'});
    getRepository(Supplier).push(neighbor);
    expect(new ManageSupplierCRUDService().createSupplier(1, 'test')).toBe(true);
    const added = getRepository(Supplier).filter(item => item !== neighbor);
    expect(getRepository(Supplier)).toHaveLength(2);
    expect(added).toHaveLength(1);
    expect(added[0]).toBeInstanceOf(Supplier);
    expect(added[0].Id).toBe(1);
    expect(added[0].Name).toBe('test');
    expect(getRepository(Supplier)).toContain(neighbor);
  });

  it('rejects a used ID without adding or replacing a Supplier', () => {
    const existing = Object.assign(new Supplier(), {Id: 1, Name: 'original'});
    getRepository(Supplier).push(existing);
    expectPreconditionRejected(() => new ManageSupplierCRUDService().createSupplier(1, 'test'));
    expect(getRepository(Supplier)).toEqual([existing]);
    expect(existing.Name).toBe('original');
  });
});
