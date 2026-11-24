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

describe('CoCoME/ManageStoreCRUDService/createStore', () => {
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
    const result = service.createStore(1, 'testname', 'testlocation', true);
    expect(result).toBe(true);
    expect(
      getRepository(Store).find(
        (e) =>
          e.Id === 1 && e.Name === 'testname' && e.Address === 'testlocation' && e.IsOpened === true
      )
    ).toBeDefined();
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageStoreCRUDService();
    const result = service.createStore(1, 'testname', 'testlocation', true);
    expect(result).toBe(true);
    expect(
      getRepository(Store).find(
        (e) => e.Id === 1 && e.Name === 'testname' && e.Address === 'testlocation'
      )
    ).toBeDefined();
    const again = new ManageStoreCRUDService();
    expectPreconditionRejected(() => again.createStore(1, 'testname', 'testlocation', true));
  });
});
