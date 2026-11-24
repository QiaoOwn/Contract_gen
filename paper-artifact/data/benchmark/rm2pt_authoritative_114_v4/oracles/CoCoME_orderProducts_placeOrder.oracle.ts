import {CoCoMEOrderProducts, OrderProduct, OrderEntry, OrderStatus, getRepository} from './entry';

// Evaluation-only R02 obligations, separate from development fixtures and algorithms.
describe('R02 duplicate-preserving order amount', () => {
  beforeEach(() => {getRepository(OrderProduct).splice(0); getRepository(OrderEntry).splice(0);});
  it.each([
    {before: 13, subtotals: [2, 8], expected: 23},
    {before: 17, subtotals: [6, 6], expected: 29},
    {before: 44, subtotals: [], expected: 44},
    {before: 1.5, subtotals: [0.25, 0.5], expected: 2.25},
  ])('adds every associated entry subtotal to the operation-entry amount: %j', example => {
    const order = Object.assign(new OrderProduct(), {Amount: example.before});
    order.ContainedEntries = example.subtotals.map(value => Object.assign(new OrderEntry(), {SubAmount: value}));
    const unassociated = Object.assign(new OrderEntry(), {SubAmount: 100});
    getRepository(OrderProduct).push(order);
    getRepository(OrderEntry).push(...order.ContainedEntries, unassociated);
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = order;
    expect(service.placeOrder()).toBe(true);
    expect(order.OrderStatus).toBe(OrderStatus.REQUESTED);
    expect(order.Amount).toBe(example.expected);
  });
  it('rejects when the current order does not exist', () => {
    expect(() => new CoCoMEOrderProducts().placeOrder()).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
});
