import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  ManageCashDeskCRUDService,
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

describe('CoCoME/ManageCashDeskCRUDService/createCashDesk', () => {
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
    const service = new ManageCashDeskCRUDService();
    const result = service.createCashDesk(1, 'test', true);
    expect(result).toBe(true);
    const cashDesk = getRepository(CashDesk).find((e) => e.Id === 1);
    expect(cashDesk).toBeDefined();
    expect(cashDesk?.Name).toBe('test');
    expect(cashDesk?.IsOpened).toBe(true);
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageCashDeskCRUDService();
    const result = service.createCashDesk(1, 'test', true);
    expect(result).toBe(true);
    expect(getRepository(CashDesk).find((e) => e.Id === 1)).toBeDefined();
    const again = new ManageCashDeskCRUDService();
    expectPreconditionRejected(() => again.createCashDesk(1, 'test', true));
  });
});
