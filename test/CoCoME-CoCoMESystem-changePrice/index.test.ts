import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  CoCoMESystem,
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

describe('CoCoME/CoCoMESystem/changePrice', () => {
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
    const item = new Item();
    item.Barcode = 123;
    item.Price = 10;
    getRepository(Item).push(item);
    const result = service.changePrice(item.Barcode, 20);
    expect(result).toBe(true);
    expect(item.Price).toBe(20);
  });

  it('rejects when precondition is violated', () => {
    const service = new CoCoMESystem();
    expectPreconditionRejected(() => service.changePrice(99, 20));
  });
});
