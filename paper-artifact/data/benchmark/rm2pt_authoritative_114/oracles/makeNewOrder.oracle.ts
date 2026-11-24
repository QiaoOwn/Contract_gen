import {CoCoMEOrderProducts, OrderProduct, OrderStatus, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned fresh product order', () => {
  beforeEach(() => getRepository(OrderProduct).splice(0));
  it.each([{id: 513, previous: false, neighbor: false}, {id: 0, previous: false, neighbor: false},
    {id: -79, previous: false, neighbor: false}, {id: 724, previous: true, neighbor: false},
    {id: 916, previous: false, neighbor: true}])('creates the fresh order $id', ({id, previous, neighbor}) => {
    const service = new CoCoMEOrderProducts();
    const old = Object.assign(new OrderProduct(), {Id: id + 19, OrderStatus: OrderStatus.NEW});
    if (previous) {service.CurrentOrderProduct = old; getRepository(OrderProduct).push(old);}
    if (neighbor) getRepository(OrderProduct).push(Object.assign(new OrderProduct(), {Id: id + 47}));
    const before = new Set([old, ...getRepository(OrderProduct)]);
    const started = Date.now(), result = service.makeNewOrder(id), ended = Date.now();
    const created = getRepository(OrderProduct).find(object => !before.has(object)) ?? service.CurrentOrderProduct;
    expect(result).toBe(true);
    expect(created).toBeInstanceOf(OrderProduct);
    expect(before.has(created)).toBe(false);
    expect(created.Id).toBe(id);
    expect(created.OrderStatus).toBe(OrderStatus.NEW);
    expect(getRepository(OrderProduct)).toContain(created);
    expect(service.CurrentOrderProduct).toBe(created);
    const time = Number(created.Time?.valueOf());
    expect(Number.isFinite(time)).toBe(true);
    expect(time).toBeGreaterThanOrEqual(started);
    expect(time).toBeLessThanOrEqual(ended);
  });
  it('rejects an identifier already used by a stored order', () => {
    getRepository(OrderProduct).push(Object.assign(new OrderProduct(), {Id: 402, OrderStatus: OrderStatus.NEW}));
    expectPreconditionRejected(() => new CoCoMEOrderProducts().makeNewOrder(402));
  });
});
