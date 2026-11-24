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

describe('CoCoME/ManageCashDeskCRUDService/queryCashDesk', () => {
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

  it('returns the cash desk with the requested id among multiple records', () => {
    const service = new ManageCashDeskCRUDService();
    const other = new CashDesk();
    other.Id = 17;
    const cashDesk = new CashDesk();
    cashDesk.Id = 41;
    getRepository(CashDesk).push(other, cashDesk);
    const result = service.queryCashDesk(cashDesk.Id);
    expect(result).toBe(cashDesk);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageCashDeskCRUDService();
    const other = new CashDesk();
    other.Id = 17;
    getRepository(CashDesk).push(other);
    expectPreconditionRejected(() => service.queryCashDesk(99));
  });
});
