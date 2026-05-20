import {getRepository, ManageSupplierCRUDService, Supplier} from './entry';
describe('CoCoME/ManageSupplierCRUDService/querySupplier', () => {
  it('Happy Path', () => {
    const service = new ManageSupplierCRUDService();
    const supplier = new Supplier();
    supplier.Id = 1;
    supplier.Name = 'testSupplier';
    getRepository(Supplier).push(supplier);
    const result = service.querySupplier(1);
    expect(result).toBe(supplier);
  });
});
