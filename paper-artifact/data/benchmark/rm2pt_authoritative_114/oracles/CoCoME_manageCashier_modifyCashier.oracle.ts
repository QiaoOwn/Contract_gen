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

describe('CoCoME/ManageCashierCRUDService/modifyCashier', () => {
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
    const result = service.modifyCashier(cashier.Id, 'modifiedName');
    expect(result).toBe(true);
    expect(cashier.Name).toBe('modifiedName');
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageCashierCRUDService();
    expectPreconditionRejected(() => service.modifyCashier(99, 'modifiedName'));
  });
});
