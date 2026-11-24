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

/**
 * TOSEM adjudication (INT-FID-015): all unambiguous obligations are in scope.
 * Happy path uses pairwise-distinct Subamounts so Set and Bag coincide.
 * OUT_OF_SCOPE: equal Subamounts — formal `sub:Set(Real)=sls->collect(...)` is a
 * shared typing defect (collect yields Bag); no authoritative expected sum until
 * the source is repaired to Bag(Real)/asBag. Do not invent Bag-sum or Set-unique-sum.
 */
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

  it('sums distinct line subtotals and marks the sale ready to pay', () => {
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

  it('sums an empty sales-line collection to zero', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = false;
    service.CurrentSale.IsReadytoPay = false;
    service.CurrentSale.ContainedSalesLine = [];
    const result = service.endSale();
    expect(result).toBe(0);
    expect(service.CurrentSale.Amount).toBe(0);
    expect(service.CurrentSale.IsReadytoPay).toBe(true);
  });

  it('rejects when current sale is missing', () => {
    const service = new ProcessSaleService();
    expectPreconditionRejected(() => service.endSale());
  });

  it('rejects when current sale is already complete', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = true;
    service.CurrentSale.IsReadytoPay = false;
    service.CurrentSale.ContainedSalesLine = [];
    expectPreconditionRejected(() => service.endSale());
  });

  it('rejects when current sale is already ready to pay', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = false;
    service.CurrentSale.IsReadytoPay = true;
    service.CurrentSale.ContainedSalesLine = [];
    expectPreconditionRejected(() => service.endSale());
  });
});
