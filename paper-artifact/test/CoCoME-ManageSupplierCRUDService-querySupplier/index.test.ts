import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  ManageSupplierCRUDService,
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

describe('CoCoME/ManageSupplierCRUDService/querySupplier', () => {
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

  it('returns the supplier with the requested id among multiple records', () => {
    const service = new ManageSupplierCRUDService();
    const other = new Supplier();
    other.Id = 17;
    const supplier = new Supplier();
    supplier.Id = 41;
    supplier.Name = 'testSupplier';
    getRepository(Supplier).push(other, supplier);
    const result = service.querySupplier(41);
    expect(result).toBe(supplier);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageSupplierCRUDService();
    const other = new Supplier();
    other.Id = 17;
    getRepository(Supplier).push(other);
    expectPreconditionRejected(() => service.querySupplier(99));
  });
});
