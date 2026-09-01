import {expectSameMembers} from '../helpers/setOracle';
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
describe('CoCoME/CoCoMESystem/showStockReports', () => {
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

  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const result = service.showStockReports();
    expectSameMembers(result, []);
  });

  it('returns all registered items irrespective of array representation', () => {
    const service = new CoCoMESystem();
    const first = new Item();
    const second = new Item();
    const items = getRepository(Item);
    items.push(first, second);

    const result = service.showStockReports();

    expectSameMembers(result, [first, second]);
  });
});
