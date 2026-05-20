import {getRepository, ManageSupplierCRUDService, Supplier} from './entry';
describe('CoCoME/ManageSupplierCRUDService/deleteSupplier', () => {
  it('Happy Path', () => {
    const service = new ManageSupplierCRUDService();
    const supplier = new Supplier();
    supplier.Id = 1;
    supplier.Name = 'testSupplier';
    getRepository(Supplier).push(supplier);
    const result = service.deleteSupplier(supplier.Id);
    expect(result).toBe(true);
    expect(getRepository(Supplier).length).toBe(0);
  });
});
