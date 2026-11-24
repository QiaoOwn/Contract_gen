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

describe('CoCoME/ManageProductCatalogCRUDService/modifyProductCatalog', () => {
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
    const result = service.modifyProductCatalog(1, 'modifiedName');
    expect(result).toBe(true);
    expect(productCatalog.Name).toBe('modifiedName');
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageProductCatalogCRUDService();
    expectPreconditionRejected(() => service.modifyProductCatalog(99, 'modifiedName'));
  });
});
