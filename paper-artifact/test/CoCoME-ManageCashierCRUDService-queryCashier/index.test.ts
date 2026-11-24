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

describe('CoCoME/ManageCashierCRUDService/queryCashier', () => {
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

  it('returns the cashier with the requested id among multiple records', () => {
    const service = new ManageCashierCRUDService();
    const other = new Cashier();
    other.Id = 17;
    const cashier = new Cashier();
    cashier.Id = 41;
    cashier.Name = 'test';
    getRepository(Cashier).push(other, cashier);
    const result = service.queryCashier(cashier.Id);
    expect(result).toBe(cashier);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageCashierCRUDService();
    const other = new Cashier();
    other.Id = 17;
    getRepository(Cashier).push(other);
    expectPreconditionRejected(() => service.queryCashier(99));
  });
});
