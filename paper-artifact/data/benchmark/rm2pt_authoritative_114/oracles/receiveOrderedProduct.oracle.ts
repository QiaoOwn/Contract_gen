import {CoCoMESystem, OrderProduct, OrderEntry, Item, OrderStatus, getRepository} from './entry';

// Evaluation-only R04: item indices identify fixture objects, not added model attributes.
describe('R04 per-Item stock accumulation', () => {
  beforeEach(() => {getRepository(OrderProduct).splice(0); getRepository(OrderEntry).splice(0); getRepository(Item).splice(0);});
  it.each([
    {stocks: [7, 31], entries: [{item: 0, quantity: 3}, {item: 1, quantity: 6}], expected: [10, 37]},
    {stocks: [8], entries: [{item: 0, quantity: 4}, {item: 0, quantity: 9}], expected: [21]},
    {stocks: [12], entries: [{item: 0, quantity: 5}, {item: 0, quantity: 5}], expected: [22]},
    {stocks: [7, 31], entries: [{item: 0, quantity: 3}, {item: 1, quantity: 6}, {item: 0, quantity: 2}], expected: [12, 37]},
    {stocks: [], entries: [], expected: []},
  ])('adds all quantities referring to the same Item to that Item entry stock: %j', example => {
    const items = example.stocks.map((stock, index) => Object.assign(new Item(), {Barcode: 73 + index, StockNumber: stock}));
    const entries = example.entries.map(entry => Object.assign(new OrderEntry(), {Item: items[entry.item], Quantity: entry.quantity}));
    const order = Object.assign(new OrderProduct(), {Id: 56, ContainedEntries: entries});
    const neighbor = Object.assign(new OrderProduct(), {Id: 42, ContainedEntries: []});
    getRepository(OrderProduct).push(neighbor, order);
    getRepository(OrderEntry).push(...entries); getRepository(Item).push(...items);
    expect(new CoCoMESystem().receiveOrderedProduct(56)).toBe(true);
    expect(order.OrderStatus).toBe(OrderStatus.RECEIVED);
    items.forEach((item, index) => expect(item.StockNumber).toBe(example.expected[index]));
  });
  it('rejects an unknown order identifier', () => {
    getRepository(OrderProduct).push(Object.assign(new OrderProduct(), {Id: 42, ContainedEntries: []}));
    expect(() => new CoCoMESystem().receiveOrderedProduct(56)).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
});
