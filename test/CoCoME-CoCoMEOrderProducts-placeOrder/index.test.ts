import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMEOrderProducts,
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

describe('CoCoME/CoCoMEOrderProducts/placeOrder', () => {
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
    service.CurrentOrderProduct = new OrderProduct();
    service.CurrentOrderProduct.Amount = 666;
    const a = new OrderEntry();
    a.SubAmount = 1;
    const b = new OrderEntry();
    b.SubAmount = 2;
    service.CurrentOrderProduct.ContainedEntries = [a, b];
    const result = service.placeOrder();
    expect(result).toBe(true);
    expect(service.CurrentOrderProduct.OrderStatus).toBe(OrderStatus.REQUESTED);
    expect(service.CurrentOrderProduct.Amount).toBe(669);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMEOrderProducts();
    expectPreconditionRejected(() => service.placeOrder());
  });
});
