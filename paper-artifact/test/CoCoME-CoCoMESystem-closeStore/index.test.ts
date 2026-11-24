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
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/CoCoMESystem/closeStore', () => {
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
    const store = new Store();
    store.Id = 1;
    store.IsOpened = true;
    getRepository(Store).push(store);
    const result = service.closeStore(store.Id);
    expect(result).toBe(true);
    expect(store.IsOpened).toBe(false);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMESystem();
    expectPreconditionRejected(() => service.closeStore(99));
  });
});
