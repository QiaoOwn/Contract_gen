import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMEOrderProducts,
  Item,
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

describe('CoCoME/CoCoMEOrderProducts/orderItem', () => {
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
    const service = new CoCoMEOrderProducts();
    const item = new Item();
    item.Barcode = 1;
    item.OrderPrice = 1;
    service.CurrentOrderProduct = new OrderProduct();
    service.CurrentOrderProduct.ContainedEntries = [];
    getRepository(Item).push(item);
    const result = service.orderItem(item.Barcode, 2);
    expect(result).toBe(true);
    expect(getRepository(OrderEntry).length).toBe(1);
    const entry = getRepository(OrderEntry)[0];
    expect(entry.Quantity).toBe(2);
    expect(entry.SubAmount).toBe(2);
    expect(entry.Item).toBe(item);
    expect(service.CurrentOrderProduct.ContainedEntries).toEqual([entry]);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMEOrderProducts();
    expectPreconditionRejected(() => service.orderItem(99, 2));
  });
});
