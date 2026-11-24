import {
  CardPayment,
  CashDesk,
  CashPayment,
  Cashier,
  Item,
  OrderEntry,
  OrderProduct,
  Payment,
  ProcessSaleService,
  ProductCatalog,
  Sale,
  SalesLineItem,
  Store,
  Supplier,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ProcessSaleService/makeNewSale', () => {
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
    const service = new ProcessSaleService();
    const cashDesk = new CashDesk();
    cashDesk.Id = 1;
    cashDesk.IsOpened = true;
    cashDesk.ContainedSales = [];
    service.CurrentCashDesk = cashDesk;
    const result = service.makeNewSale();
    expect(result).toBe(true);
    expect(service.CurrentSale.BelongedCashDesk).toBe(service.CurrentCashDesk);
    expect(service.CurrentCashDesk.ContainedSales).toContain(service.CurrentSale);
    expect(service.CurrentSale.IsComplete).toBe(false);
    expect(service.CurrentSale.IsReadytoPay).toBe(false);
    expect(getRepository(Sale)).toContain(service.CurrentSale);
  });

  it('rejects when precondition is violated', () => {
    const service = new ProcessSaleService();
    expectPreconditionRejected(() => service.makeNewSale());
  });
});
