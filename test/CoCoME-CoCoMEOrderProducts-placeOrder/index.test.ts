import {CoCoMEOrderProducts, OrderEntry, OrderProduct, OrderStatus} from './entry';
describe('CoCoME/CoCoMEOrderProducts/placeOrder', () => {
  it('Happy Path', () => {
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = new OrderProduct();
    service.CurrentOrderProduct.Amount = 666;
    const a = new OrderEntry();
    a.SubAmount = 1;
    const b = new OrderEntry();
    b.SubAmount = 2;
    service.CurrentOrderProduct.ContainedEntries = [a, b];
    const result = service.placeOrder();
    expect(result).toBe(true);
    expect(service.CurrentOrderProduct.OrderStatus).toBe(OrderStatus.REQUESTED);
    expect(service.CurrentOrderProduct.Amount).toBe(669);
  });
});
