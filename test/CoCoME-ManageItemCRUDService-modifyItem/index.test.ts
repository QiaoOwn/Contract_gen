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

describe('CoCoME/ManageItemCRUDService/modifyItem', () => {
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
    const item = new Item();
    item.Barcode = 1;
    item.Name = 'test';
    item.Price = 1;
    item.OrderPrice = 1;
    item.StockNumber = 1;
    getRepository(Item).push(item);
    const result = service.modifyItem(item.Barcode, 'modifiedName', 2, 2, 2);
    expect(result).toBe(true);
    expect(item.Name).toBe('modifiedName');
    expect(item.Price).toBe(2);
    expect(item.OrderPrice).toBe(2);
    expect(item.StockNumber).toBe(2);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageItemCRUDService();
    expectPreconditionRejected(() => service.modifyItem(99, 'modifiedName', 2, 2, 2));
  });
});
