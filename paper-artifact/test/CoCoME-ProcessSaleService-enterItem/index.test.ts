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

  it('applies quantity to subtotal and pre-state stock decrement', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.ContainedSalesLine = [];
    service.CurrentSale.IsComplete = false;
    const other = new Item();
    other.Barcode = 99;
    other.StockNumber = 10;
    other.Price = 1.0;
    const item = new Item();
    item.Barcode = 41;
    item.StockNumber = 5;
    item.Price = 3.5;
    // Competing barcode first so a first-element-only impl fails selection.
    getRepository(Item).push(other, item);
    const result = service.enterItem(41, 2);
    const line = service.CurrentSaleLine;
    expect(result).toBe(true);
    expect(line).toBeDefined();
    expect(line.Quantity).toBe(2);
    expect(line.Subamount).toBe(7);
    expect(line.BelongedItem).toBe(item);
    expect(line.BelongedSale).toBe(service.CurrentSale);
    expect(service.CurrentSale.ContainedSalesLine).toContain(line);
    expect(getRepository(SalesLineItem)).toContain(line);
    expect(item.StockNumber).toBe(3);
    expect(other.StockNumber).toBe(10);
  });

  it('rejects when item does not exist', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.ContainedSalesLine = [];
    service.CurrentSale.IsComplete = false;
    expectPreconditionRejected(() => service.enterItem(99, 1));
    expect(getRepository(SalesLineItem)).toHaveLength(0);
  });

  it('rejects when current sale is missing', () => {
    const service = new ProcessSaleService();
    const item = new Item();
    item.Barcode = 41;
    item.StockNumber = 5;
    item.Price = 3.5;
    getRepository(Item).push(item);
    expectPreconditionRejected(() => service.enterItem(41, 1));
    expect(item.StockNumber).toBe(5);
    expect(getRepository(SalesLineItem)).toHaveLength(0);
  });

  it('rejects an item with zero stock without creating a line', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.ContainedSalesLine = [];
    service.CurrentSale.IsComplete = false;
    const item = new Item();
    item.Barcode = 41;
    item.StockNumber = 0;
    item.Price = 3.5;
    getRepository(Item).push(item);
    expectPreconditionRejected(() => service.enterItem(41, 1));
    expect(item.StockNumber).toBe(0);
    expect(getRepository(SalesLineItem)).toHaveLength(0);
  });

  it('rejects when current sale is already complete', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.ContainedSalesLine = [];
    service.CurrentSale.IsComplete = true;
    const item = new Item();
    item.Barcode = 41;
    item.StockNumber = 5;
    item.Price = 3.5;
    getRepository(Item).push(item);
    expectPreconditionRejected(() => service.enterItem(41, 1));
    expect(item.StockNumber).toBe(5);
    expect(getRepository(SalesLineItem)).toHaveLength(0);
  });
});
