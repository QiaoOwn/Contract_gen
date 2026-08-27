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

describe('CoCoME/ProcessSaleService/endSale', () => {
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
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = false;
    service.CurrentSale.IsReadytoPay = false;
    const a = new SalesLineItem();
    const b = new SalesLineItem();
    const c = new SalesLineItem();
    a.Subamount = 1;
    b.Subamount = 2;
    c.Subamount = 3;
    service.CurrentSale.ContainedSalesLine = [a, b, c];
    const result = service.endSale();
    expect(result).toBe(6);
    expect(service.CurrentSale.Amount).toBe(6);
    expect(service.CurrentSale.IsReadytoPay).toBe(true);
  });

  it('rejects when current sale is already complete', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = true;
    service.CurrentSale.IsReadytoPay = false;
    service.CurrentSale.ContainedSalesLine = [];
    expectPreconditionRejected(() => service.endSale());
  });
});
