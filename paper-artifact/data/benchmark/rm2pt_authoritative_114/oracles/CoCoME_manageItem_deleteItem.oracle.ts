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

describe('CoCoME/ManageItemCRUDService/deleteItem', () => {
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
    const item = new Item();
    item.Barcode = 1;
    item.Name = 'test';
    item.Price = 1;
    item.OrderPrice = 1;
    item.StockNumber = 1;
    getRepository(Item).push(item);
    const service = new ManageItemCRUDService();
    const result = service.deleteItem(item.Barcode);
    expect(result).toBe(true);
    expect(getRepository(Item).length).toBe(0);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageItemCRUDService();
    expectPreconditionRejected(() => service.deleteItem(99));
  });
});
