import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMESystem,
  Item,
  OrderEntry,
  OrderProduct,
  OrderStatus,
  Payment,
  ProductCatalog,
  Sale,
  SalesLineItem,
  Store,
  Supplier,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/CoCoMESystem/receiveOrderedProduct', () => {
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
    const service = new CoCoMESystem();
    const orderProduct = new OrderProduct();
    orderProduct.Id = 1;
    const a = new OrderEntry();
    a.Quantity = 1;
    a.Item = new Item();
    a.Item.StockNumber = 1;
    const b = new OrderEntry();
    b.Quantity = 2;
    b.Item = new Item();
    b.Item.StockNumber = 2;
    const c = new OrderEntry();
    c.Quantity = 3;
    c.Item = new Item();
    c.Item.StockNumber = 3;
    orderProduct.ContainedEntries = [a, b, c];
    getRepository(OrderProduct).push(orderProduct);
    const result = service.receiveOrderedProduct(orderProduct.Id);
    expect(result).toBe(true);
    expect(orderProduct.OrderStatus).toBe(OrderStatus.RECEIVED);
    expect(a.Item.StockNumber).toBe(2);
    expect(b.Item.StockNumber).toBe(4);
    expect(c.Item.StockNumber).toBe(6);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMESystem();
    expectPreconditionRejected(() => service.receiveOrderedProduct(99));
  });
});
