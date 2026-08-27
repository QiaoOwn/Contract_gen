import dayjs from 'dayjs';
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

describe('CoCoME/CoCoMEOrderProducts/makeNewOrder', () => {
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
    const result = service.makeNewOrder(1);
    const orderProduct = getRepository(OrderProduct).find((e) => e.Id === 1);
    expect(result).toBe(true);
    expect(orderProduct).toBeDefined();
    expect(orderProduct.OrderStatus).toBe(OrderStatus.NEW);
    expect(orderProduct.Id).toBe(1);
    expect(orderProduct.Time.isSame(dayjs(), 'second')).toBe(true);
    expect(service.CurrentOrderProduct).toBe(orderProduct);
  });

  it('rejects when order id already exists', () => {
    const service = new CoCoMEOrderProducts();
    const existing = new OrderProduct();
    existing.Id = 1;
    existing.OrderStatus = OrderStatus.NEW;
    getRepository(OrderProduct).push(existing);
    expectPreconditionRejected(() => service.makeNewOrder(1));
    expect(getRepository(OrderProduct)).toHaveLength(1);
    expect(getRepository(OrderProduct)[0]).toBe(existing);
  });
});
