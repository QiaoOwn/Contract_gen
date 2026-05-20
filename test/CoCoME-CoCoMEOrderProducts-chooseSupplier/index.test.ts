import {CoCoMEOrderProducts, getRepository, OrderProduct, Supplier} from './entry';
describe('CoCoME/CoCoMEOrderProducts/chooseSupplier', () => {
  it('Happy Path', () => {
    const service = new CoCoMEOrderProducts();
    const supplier = new Supplier();
    supplier.Id = 1;
    getRepository(Supplier).push(supplier);
    service.CurrentOrderProduct = new OrderProduct();
    const result = service.chooseSupplier(supplier.Id);
    expect(result).toBe(true);
    expect(service.CurrentOrderProduct.Supplier).toBe(supplier);
  });
});
