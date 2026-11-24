import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMEOrderProducts,
  Item,
  OrderEntry,
  OrderProduct,
  Payment,
  ProductCatalog,
  Sale,
  SalesLineItem,
  Store,
  Supplier,
  getRepository,
} from './entry';
import {clearRepositories} from '../helpers/contractOracle';

// Vacuous precondition (true): rejection case not required by test/ORACLE.md.
describe('CoCoME/CoCoMEOrderProducts/listAllOutOfStoreProducts', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(CardPayment),
      getRepository(CashDesk),
      getRepository(CashPayment),
      getRepository(Cashier),
      getRepository(Item),
      getRepository(OrderEntry),
      getRepository(OrderProduct),
      getRepository(Payment),
      getRepository(ProductCatalog),
      getRepository(Sale),
      getRepository(SalesLineItem),
      getRepository(Store),
      getRepository(Supplier)
    );
  });

  it('returns every out-of-stock item and excludes stocked items', () => {
    const service = new CoCoMEOrderProducts();
    const a = new Item();
    a.StockNumber = 1;
    const b = new Item();
    b.StockNumber = 0;
    const c = new Item();
    c.StockNumber = 0;
    const d = new Item();
    d.StockNumber = 4;
    getRepository(Item).push(a, b, c, d);
    const result = service.listAllOutOfStoreProducts();
    expect(result).toEqual([b, c]);
    expect(result).not.toContain(a);
    expect(result).not.toContain(d);
  });

  it('returns an empty collection when every item is in stock', () => {
    const service = new CoCoMEOrderProducts();
    const first = new Item();
    first.StockNumber = 1;
    const second = new Item();
    second.StockNumber = 2;
    getRepository(Item).push(first, second);

    const result = service.listAllOutOfStoreProducts();

    expect(result).toEqual([]);
  });
});
