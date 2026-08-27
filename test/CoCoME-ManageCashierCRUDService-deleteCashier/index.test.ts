import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  ManageCashierCRUDService,
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

describe('CoCoME/ManageCashierCRUDService/deleteCashier', () => {
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
    const service = new ManageCashierCRUDService();
    const cashier = new Cashier();
    cashier.Id = 1;
    cashier.Name = 'test';
    getRepository(Cashier).push(cashier);
    const result = service.deleteCashier(1);
    expect(result).toBe(true);
    expect(getRepository(Cashier).length).toBe(0);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageCashierCRUDService();
    expectPreconditionRejected(() => service.deleteCashier(99));
  });
});
