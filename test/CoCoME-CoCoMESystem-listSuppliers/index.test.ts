import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMESystem,
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
describe('CoCoME/CoCoMESystem/listSuppliers', () => {
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

  it('returns every registered supplier', () => {
    const service = new CoCoMESystem();
    const first = new Supplier();
    const second = new Supplier();
    const unrelatedItem = new Item();
    getRepository(Supplier).push(first, second);
    getRepository(Item).push(unrelatedItem);

    const result = service.listSuppliers();

    expect(result).toBe(getRepository(Supplier));
    expect(result).toEqual([first, second]);
    expect(result).not.toContain(unrelatedItem);
  });

  it('returns an empty collection when no suppliers are registered', () => {
    const service = new CoCoMESystem();

    const result = service.listSuppliers();

    expect(result).toEqual([]);
    expect(result).toBe(getRepository(Supplier));
  });
});
