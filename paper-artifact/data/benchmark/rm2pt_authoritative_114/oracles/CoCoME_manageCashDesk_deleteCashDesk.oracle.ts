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

describe('CoCoME/ManageCashDeskCRUDService/deleteCashDesk', () => {
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
    const cashDesk = new CashDesk();
    cashDesk.Id = 1;
    getRepository(CashDesk).push(cashDesk);
    const result = service.deleteCashDesk(1);
    expect(result).toBe(true);
    expect(getRepository(CashDesk).length).toBe(0);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageCashDeskCRUDService();
    expectPreconditionRejected(() => service.deleteCashDesk(99));
  });
});
