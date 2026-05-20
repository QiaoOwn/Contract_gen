import {CoCoMESystem, getRepository, Supplier} from './entry';
describe('CoCoME/CoCoMESystem/listSuppliers', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const supplier = new Supplier();
    getRepository(Supplier).push(supplier);
    const result = service.listSuppliers();
    expect(result).toBe(getRepository(Supplier));
  });
});
