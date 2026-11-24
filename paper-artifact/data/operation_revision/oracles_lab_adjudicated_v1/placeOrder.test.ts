import {
  CoCoMEOrderProducts,
  OrderEntry,
  OrderProduct,
  OrderStatus,
  getRepository,
} from '../../../test/CoCoME-CoCoMEOrderProducts-placeOrder/entry';
import {clearRepositories} from '../../../test/helpers/contractOracle';

describe('lab adjudication: placeOrder', () => {
  beforeEach(() => clearRepositories(getRepository(OrderEntry), getRepository(OrderProduct)));

  it('counts equal subtotals on distinct entries separately', () => {
    const service = new CoCoMEOrderProducts();
    const order = new OrderProduct();
    order.Amount = 100;
    const first = new OrderEntry();
    first.SubAmount = 20;
    const second = new OrderEntry();
    second.SubAmount = 20;
    order.ContainedEntries = [first, second];
    service.CurrentOrderProduct = order;

    expect(service.placeOrder()).toBe(true);
    expect(order.Amount).toBe(140);
    expect(order.OrderStatus).toBe(OrderStatus.REQUESTED);
  });

  it('allows an empty order without changing its amount', () => {
    const service = new CoCoMEOrderProducts();
    const order = new OrderProduct();
    order.Amount = 100;
    order.ContainedEntries = [];
    service.CurrentOrderProduct = order;

    expect(service.placeOrder()).toBe(true);
    expect(order.Amount).toBe(100);
    expect(order.OrderStatus).toBe(OrderStatus.REQUESTED);
  });
});
