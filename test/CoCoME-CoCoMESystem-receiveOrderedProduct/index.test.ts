import {CoCoMESystem, getRepository, Item, OrderEntry, OrderProduct} from './entry';
describe('CoCoME/CoCoMESystem/receiveOrderedProduct', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const orderProduct = new OrderProduct();
    orderProduct.Id = 1;
    const a = new OrderEntry();
    a.Quantity = 1;
    a.Item = new Item();
    a.Item.StockNumber = 1;
    const b = new OrderEntry();
    b.Quantity = 2;
    b.Item = new Item();
    b.Item.StockNumber = 2;
    const c = new OrderEntry();
    c.Quantity = 3;
    c.Item = new Item();
    c.Item.StockNumber = 3;
    orderProduct.ContainedEntries = [a, b, c];
    getRepository(OrderProduct).push(orderProduct);
    const result = service.receiveOrderedProduct(orderProduct.Id);
    expect(result).toBe(true);
    expect(a.Item.StockNumber).toBe(2);
    expect(b.Item.StockNumber).toBe(4);
    expect(c.Item.StockNumber).toBe(6);
  });
});
