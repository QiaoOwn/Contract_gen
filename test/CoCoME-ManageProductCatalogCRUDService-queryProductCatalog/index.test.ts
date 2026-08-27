import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  ManageProductCatalogCRUDService,
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

describe('CoCoME/ManageProductCatalogCRUDService/queryProductCatalog', () => {
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
    const service = new ManageProductCatalogCRUDService();
    const productCatalog = new ProductCatalog();
    productCatalog.Id = 1;
    productCatalog.Name = 'test';
    getRepository(ProductCatalog).push(productCatalog);
    const result = service.queryProductCatalog(1);
    expect(result).toBe(productCatalog);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageProductCatalogCRUDService();
    expectPreconditionRejected(() => service.queryProductCatalog(99));
  });
});
