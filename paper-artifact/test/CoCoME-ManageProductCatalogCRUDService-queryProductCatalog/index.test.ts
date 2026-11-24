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

  it('returns the catalog identified by id among multiple records', () => {
    const service = new ManageProductCatalogCRUDService();
    const other = new ProductCatalog();
    other.Id = 17;
    const target = new ProductCatalog();
    target.Id = 41;
    getRepository(ProductCatalog).push(other, target);
    expect(service.queryProductCatalog(41)).toBe(target);
  });

  it('rejects when catalog does not exist', () => {
    const service = new ManageProductCatalogCRUDService();
    const other = new ProductCatalog();
    other.Id = 17;
    getRepository(ProductCatalog).push(other);
    expectPreconditionRejected(() => service.queryProductCatalog(99));
  });
});
