import {CoCoMEOrderProducts, getRepository, Item} from './entry';
describe('CoCoME/CoCoMEOrderProducts/listAllOutOfStoreProducts', () => {
  it('Happy Path', () => {
    const service = new CoCoMEOrderProducts();
    const a = new Item();
    a.StockNumber = 1;
    const b = new Item();
    b.StockNumber = 0;
    const c = new Item();
    c.StockNumber = 1;
    getRepository(Item).push(a, b, c);
    const result = service.listAllOutOfStoreProducts();
    expect(result).toContain(b);
    expect(result).not.toContain(a);
    expect(result).not.toContain(c);
  });
});
