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

describe('CoCoME/ManageSupplierCRUDService/deleteSupplier', () => {
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
    const service = new ManageSupplierCRUDService();
    const supplier = new Supplier();
    supplier.Id = 1;
    supplier.Name = 'testSupplier';
    getRepository(Supplier).push(supplier);
    const result = service.deleteSupplier(supplier.Id);
    expect(result).toBe(true);
    expect(getRepository(Supplier).length).toBe(0);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageSupplierCRUDService();
    expectPreconditionRejected(() => service.deleteSupplier(99));
  });
});
