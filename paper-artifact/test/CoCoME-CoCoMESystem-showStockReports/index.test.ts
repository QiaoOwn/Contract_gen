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

  it('returns every Item record', () => {
    const service = new CoCoMESystem();
    const first = new Item();
    const second = new Item();
    getRepository(Item).push(first, second);

    const result = service.showStockReports();

    expectSameMembers(result, [first, second]);
    expect(getRepository(Item)).toHaveLength(2);
  });

  it('returns an empty collection when no items are registered', () => {
    const service = new CoCoMESystem();
    expectSameMembers(service.showStockReports(), []);
  });
});
