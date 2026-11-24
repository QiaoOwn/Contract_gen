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

describe('CoCoME/CoCoMESystem/closeCashDesk', () => {
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
    const cashDesk = new CashDesk();
    const store = new Store();
    store.IsOpened = true;
    service.CurrentStore = store;
    cashDesk.Id = 1;
    cashDesk.IsOpened = true;
    getRepository(CashDesk).push(cashDesk);
    const result = service.closeCashDesk(cashDesk.Id);
    expect(result).toBe(true);
    expect(cashDesk.IsOpened).toBe(false);
    expect(service.CurrentCashDesk).toBe(cashDesk);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMESystem();
    expectPreconditionRejected(() => service.closeCashDesk(99));
  });
});
