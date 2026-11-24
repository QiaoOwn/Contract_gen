import {
  CoCoMESystem,
  Item,
  OrderEntry,
  OrderProduct,
  OrderStatus,
  getRepository,
} from './receiveOrderedProduct.reference';
import {clearRepositories} from '../../../test/helpers/contractOracle';

describe('lab adjudication: receiveOrderedProduct', () => {
  beforeEach(() =>
    clearRepositories(getRepository(Item), getRepository(OrderEntry), getRepository(OrderProduct))
  );

  it('adds all quantities for entries referring to the same item', () => {
    const service = new CoCoMESystem();
    const item = new Item();
    item.StockNumber = 10;
    const first = new OrderEntry();
    first.Item = item;
    first.Quantity = 2;
    const second = new OrderEntry();
    second.Item = item;
    second.Quantity = 3;
    const order = new OrderProduct();
    order.Id = 7;
    order.ContainedEntries = [first, second];
    getRepository(OrderProduct).push(order);

    expect(service.receiveOrderedProduct(7)).toBe(true);
    expect(item.StockNumber).toBe(15);
    expect(order.OrderStatus).toBe(OrderStatus.RECEIVED);
  });
});
