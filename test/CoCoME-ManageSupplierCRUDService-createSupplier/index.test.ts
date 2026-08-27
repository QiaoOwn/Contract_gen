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

describe('CoCoME/ManageSupplierCRUDService/createSupplier', () => {
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
    const result = service.createSupplier(1, 'test');
    expect(result).toBe(true);
    expect(getRepository(Supplier).find((e) => e.Id === 1 && e.Name === 'test')).toBeDefined();
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageSupplierCRUDService();
    const result = service.createSupplier(1, 'test');
    expect(result).toBe(true);
    expect(getRepository(Supplier).find((e) => e.Id === 1 && e.Name === 'test')).toBeDefined();
    const again = new ManageSupplierCRUDService();
    expectPreconditionRejected(() => again.createSupplier(1, 'test'));
  });
});
