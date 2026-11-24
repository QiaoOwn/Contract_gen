import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  ManageStoreCRUDService,
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

describe('CoCoME/ManageStoreCRUDService/queryStore', () => {
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

  it('returns the store with the requested id among multiple records', () => {
    const service = new ManageStoreCRUDService();
    const other = new Store();
    other.Id = 17;
    const store = new Store();
    store.Id = 41;
    store.Name = 'testStore';
    store.Address = 'testAddress';
    store.IsOpened = true;
    getRepository(Store).push(other, store);
    const result = service.queryStore(41);
    expect(result).toBe(store);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageStoreCRUDService();
    const other = new Store();
    other.Id = 17;
    getRepository(Store).push(other);
    expectPreconditionRejected(() => service.queryStore(99));
  });
});
