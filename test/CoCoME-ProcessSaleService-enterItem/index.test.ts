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

describe('CoCoME/ProcessSaleService/enterItem', () => {
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
    service.CurrentSale.ContainedSalesLine = [];
    service.CurrentSale.IsComplete = false;
    const item = new Item();
    item.Barcode = 1;
    item.StockNumber = 2;
    item.Price = 3.5;
    getRepository(Item).push(item);
    const result = service.enterItem(1, 1);
    expect(result).toBe(true);
    expect(service.CurrentSaleLine).toBeDefined();
    expect(service.CurrentSaleLine.BelongedSale).toBe(service.CurrentSale);
    expect(service.CurrentSaleLine.BelongedItem).toBe(item);
    expect(service.CurrentSaleLine.Quantity).toBe(1);
    expect(service.CurrentSaleLine.Subamount).toBe(3.5);
    expect(service.CurrentSale.ContainedSalesLine).toContain(service.CurrentSaleLine);
    expect(getRepository(SalesLineItem)).toContain(service.CurrentSaleLine);
    expect(item.StockNumber).toBe(1);
  });

  it('rejects when precondition is violated', () => {
    const service = new ProcessSaleService();
    expectPreconditionRejected(() => service.enterItem(99, 1));
  });
});
