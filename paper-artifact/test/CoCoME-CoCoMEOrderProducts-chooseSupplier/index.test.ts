import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMEOrderProducts,
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

describe('CoCoME/CoCoMEOrderProducts/chooseSupplier', () => {
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
    const service = new CoCoMEOrderProducts();
    const supplier = new Supplier();
    supplier.Id = 1;
    getRepository(Supplier).push(supplier);
    service.CurrentOrderProduct = new OrderProduct();
    const result = service.chooseSupplier(supplier.Id);
    expect(result).toBe(true);
    expect(service.CurrentOrderProduct.Supplier).toBe(supplier);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMEOrderProducts();
    expectPreconditionRejected(() => service.chooseSupplier(99));
  });
});
