import {CoCoMEOrderProducts, getRepository, OrderProduct, OrderStatus} from './entry';
describe('CoCoME/CoCoMEOrderProducts/makeNewOrder', () => {
  it('Happy Path', () => {
    const service = new CoCoMEOrderProducts();
    const result = service.makeNewOrder(1);
    const orderProduct = getRepository(OrderProduct).find((e) => e.Id === 1);
    expect(result).toBe(true);
    expect(orderProduct).toBeDefined();
    expect(orderProduct.OrderStatus).toBe(OrderStatus.NEW);
    expect(orderProduct.Id).toBe(1);
    expect(service.CurrentOrderProduct).toBe(orderProduct);
  });
});
