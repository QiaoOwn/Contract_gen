import {getRepository, ManageSupplierCRUDService, Supplier} from './entry';
describe('CoCoME/ManageSupplierCRUDService/createSupplier', () => {
  it('Happy Path', () => {
    const service = new ManageSupplierCRUDService();
    const result = service.createSupplier(1, 'test');
    expect(result).toBe(true);
    expect(getRepository(Supplier).find((e) => e.Id === 1 && e.Name === 'test')).toBeDefined();
  });
});
