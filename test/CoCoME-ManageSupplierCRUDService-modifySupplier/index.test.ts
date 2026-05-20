import {getRepository, ManageSupplierCRUDService, Supplier} from './entry';
describe('CoCoME/ManageSupplierCRUDService/modifySupplier', () => {
  it('Happy Path', () => {
    const service = new ManageSupplierCRUDService();
    const supplier = new Supplier();
    supplier.Id = 1;
    supplier.Name = 'testSupplier';
    getRepository(Supplier).push(supplier);
    const result = service.modifySupplier(supplier.Id, 'modifiedName');
    expect(result).toBe(true);
    expect(supplier.Name).toBe('modifiedName');
  });
});
