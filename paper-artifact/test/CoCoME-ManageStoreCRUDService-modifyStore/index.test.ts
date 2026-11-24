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

describe('CoCoME/ManageStoreCRUDService/modifyStore', () => {
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
    const result = service.modifyStore(store.Id, 'modifiedName', 'modifiedAddress', false);
    expect(result).toBe(true);
    expect(store.Name).toBe('modifiedName');
    expect(store.Address).toBe('modifiedAddress');
    expect(store.IsOpened).toBe(false);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageStoreCRUDService();
    expectPreconditionRejected(() =>
      service.modifyStore(99, 'modifiedName', 'modifiedAddress', false)
    );
  });
});
