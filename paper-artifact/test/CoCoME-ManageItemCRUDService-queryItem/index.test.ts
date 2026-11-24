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

describe('CoCoME/ManageItemCRUDService/queryItem', () => {
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

  it('returns the item whose barcode matches among multiple records', () => {
    const service = new ManageItemCRUDService();
    const other = new Item();
    other.Barcode = 17;
    const target = new Item();
    target.Barcode = 41;
    getRepository(Item).push(other, target);
    expect(service.queryItem(41)).toBe(target);
  });

  it('rejects when item does not exist', () => {
    const service = new ManageItemCRUDService();
    const other = new Item();
    other.Barcode = 17;
    getRepository(Item).push(other);
    expectPreconditionRejected(() => service.queryItem(99));
  });
});
