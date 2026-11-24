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

describe('CoCoME/ManageStoreCRUDService/deleteStore', () => {
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
    const service = new ManageStoreCRUDService();
    const store = new Store();
    store.Id = 1;
    store.Name = 'testStore';
    store.Address = 'testAddress';
    store.IsOpened = true;
    getRepository(Store).push(store);
    const result = service.deleteStore(1);
    expect(result).toBe(true);
    expect(getRepository(Store).length).toBe(0);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageStoreCRUDService();
    expectPreconditionRejected(() => service.deleteStore(99));
  });
});
