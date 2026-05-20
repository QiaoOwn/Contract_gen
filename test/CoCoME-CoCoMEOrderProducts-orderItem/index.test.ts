import {CoCoMEOrderProducts, getRepository, Item, OrderEntry, OrderProduct} from './entry';
describe('CoCoME/CoCoMEOrderProducts/orderItem', () => {
  it('Happy Path', () => {
    const service = new CoCoMEOrderProducts();
    const item = new Item();
    item.Barcode = 1;
    item.OrderPrice = 1;
    service.CurrentOrderProduct = new OrderProduct();
    service.CurrentOrderProduct.ContainedEntries = [];
    getRepository(Item).push(item);
    const result = service.orderItem(item.Barcode, 2);
    expect(result).toBe(true);
    expect(getRepository(OrderEntry).length).toBe(1);
    expect(service.CurrentOrderProduct.ContainedEntries.length).toBe(1);
  });
});
