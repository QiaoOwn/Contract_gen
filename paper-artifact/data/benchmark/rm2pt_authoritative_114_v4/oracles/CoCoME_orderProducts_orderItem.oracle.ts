import {CoCoMEOrderProducts, Item, OrderEntry, OrderProduct, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/CoCoMEOrderProducts/orderItem', () => {
  beforeEach(() =>
    clearRepositories(getRepository(Item), getRepository(OrderEntry), getRepository(OrderProduct))
  );

  it('selects by barcode, writes SubAmount, and adds exactly one linked OrderEntry', () => {
    const other = Object.assign(new Item(), {Barcode: 11, OrderPrice: 2.5});
    const selected = Object.assign(new Item(), {Barcode: 22, OrderPrice: 3.75});
    getRepository(Item).push(other, selected);
    const prior = Object.assign(new OrderEntry(), {
      Quantity: 1,
      SubAmount: 3.75,
      Item: selected,
    });
    const foreign = Object.assign(new OrderEntry(), {
      Quantity: 9,
      SubAmount: 99,
      Item: other,
    });
    const neighbor = Object.assign(new OrderProduct(), {Id: 7, ContainedEntries: [foreign]});
    const order = Object.assign(new OrderProduct(), {Id: 3, ContainedEntries: [prior]});
    getRepository(OrderProduct).push(neighbor, order);
    getRepository(OrderEntry).push(prior, foreign);
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = order;
    expect(service.orderItem(22, 3)).toBe(true);
    const created = getRepository(OrderEntry).filter(item => item !== prior && item !== foreign);
    expect(getRepository(OrderEntry)).toHaveLength(3);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(OrderEntry);
    expect(created[0].Item).toBe(selected);
    expect(created[0].Quantity).toBe(3);
    expect(created[0].SubAmount).toBe(11.25);
    expect(order.ContainedEntries).toEqual([prior, created[0]]);
    expect(neighbor.ContainedEntries).toEqual([foreign]);
    expect(prior.Quantity).toBe(1);
    expect(prior.SubAmount).toBe(3.75);
    expect(prior.Item).toBe(selected);
    expect(foreign.Quantity).toBe(9);
    expect(foreign.SubAmount).toBe(99);
    expect(foreign.Item).toBe(other);
  });

  it('rejects a missing item without creating an OrderEntry', () => {
    const order = Object.assign(new OrderProduct(), {Id: 3, ContainedEntries: []});
    getRepository(OrderProduct).push(order);
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = order;
    expectPreconditionRejected(() => service.orderItem(99, 1));
    expect(getRepository(OrderEntry)).toHaveLength(0);
    expect(order.ContainedEntries).toEqual([]);
  });

  it('rejects a missing current order under the approved v2 clarification', () => {
    getRepository(Item).push(Object.assign(new Item(), {Barcode: 22, OrderPrice: 3.75}));
    expectPreconditionRejected(() => new CoCoMEOrderProducts().orderItem(22, 3));
    expect(getRepository(OrderEntry)).toHaveLength(0);
  });
});
