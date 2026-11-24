import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  ManageItemCRUDService,
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

describe('CoCoME/ManageItemCRUDService/createItem', () => {
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
    const service = new ManageItemCRUDService();
    const result = service.createItem(1, 'test', 1, 1, 1);
    expect(result).toBe(true);
    expect(
      getRepository(Item).find(
        (e) =>
          e.Barcode === 1 &&
          e.Name === 'test' &&
          e.Price === 1 &&
          e.StockNumber === 1 &&
          e.OrderPrice === 1
      )
    ).toBeDefined();
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageItemCRUDService();
    const result = service.createItem(1, 'test', 1, 1, 1);
    expect(result).toBe(true);
    expect(
      getRepository(Item).find(
        (e) =>
          e.Barcode === 1 &&
          e.Name === 'test' &&
          e.Price === 1 &&
          e.StockNumber === 1 &&
          e.OrderPrice === 1
      )
    ).toBeDefined();
    const again = new ManageItemCRUDService();
    expectPreconditionRejected(() => again.createItem(1, 'test', 1, 1, 1));
  });
});
