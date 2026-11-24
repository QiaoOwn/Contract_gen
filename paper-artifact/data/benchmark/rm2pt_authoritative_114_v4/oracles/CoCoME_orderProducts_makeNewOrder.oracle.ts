import {CoCoMEOrderProducts, OrderProduct, OrderStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/CoCoMEOrderProducts/makeNewOrder', () => {
  beforeEach(() => clearRepositories(getRepository(OrderProduct)));

  it('creates exactly one NEW order, records time, and sets CurrentOrderProduct', () => {
    const previous = Object.assign(new OrderProduct(), {
      Id: 40,
      OrderStatus: OrderStatus.NEW,
      Amount: 7,
    });
    const neighbor = Object.assign(new OrderProduct(), {
      Id: 88,
      OrderStatus: OrderStatus.REQUESTED,
      Amount: 3,
    });
    getRepository(OrderProduct).push(previous, neighbor);
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = previous;
    const started = Date.now();
    expect(service.makeNewOrder(513)).toBe(true);
    const ended = Date.now();
    const created = getRepository(OrderProduct).filter(item => item !== previous && item !== neighbor);
    expect(getRepository(OrderProduct)).toHaveLength(3);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(OrderProduct);
    expect(created[0].Id).toBe(513);
    expect(created[0].OrderStatus).toBe(OrderStatus.NEW);
    expect(service.CurrentOrderProduct).toBe(created[0]);
    expect(getRepository(OrderProduct)).toContain(previous);
    expect(getRepository(OrderProduct)).toContain(neighbor);
    expect(previous.Id).toBe(40);
    expect(previous.OrderStatus).toBe(OrderStatus.NEW);
    expect(previous.Amount).toBe(7);
    expect(neighbor.Id).toBe(88);
    expect(neighbor.OrderStatus).toBe(OrderStatus.REQUESTED);
    expect(neighbor.Amount).toBe(3);
    const time = Number(created[0].Time?.valueOf());
    expect(Number.isFinite(time)).toBe(true);
    expect(time).toBeGreaterThanOrEqual(started);
    expect(time).toBeLessThanOrEqual(ended);
  });

  it('rejects a duplicate identifier without adding or replacing an order', () => {
    const existing = Object.assign(new OrderProduct(), {
      Id: 402,
      OrderStatus: OrderStatus.NEW,
      Amount: 11,
    });
    getRepository(OrderProduct).push(existing);
    expectPreconditionRejected(() => new CoCoMEOrderProducts().makeNewOrder(402));
    expect(getRepository(OrderProduct)).toEqual([existing]);
    expect(existing.OrderStatus).toBe(OrderStatus.NEW);
    expect(existing.Amount).toBe(11);
  });
});
