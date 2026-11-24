import {Item, ProcessSaleService, Sale, SalesLineItem, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME enterItem, approved laboratory quantity bound', () => {
  beforeEach(() => clearRepositories(getRepository(Item), getRepository(Sale), getRepository(SalesLineItem)));

  function setup() {
    const service = new ProcessSaleService();
    const prior = Object.assign(new SalesLineItem(), {Quantity: 1, Subamount: 3.5});
    const foreign = Object.assign(new SalesLineItem(), {Quantity: 4, Subamount: 8});
    const sale = Object.assign(new Sale(), {
      IsComplete: false,
      ContainedSalesLine: [prior] as SalesLineItem[],
    });
    const neighbor = Object.assign(new Sale(), {
      IsComplete: false,
      ContainedSalesLine: [foreign] as SalesLineItem[],
    });
    prior.BelongedSale = sale;
    foreign.BelongedSale = neighbor;
    const other = Object.assign(new Item(), {Barcode: 11, StockNumber: 12, Price: 1.25});
    const item = Object.assign(new Item(), {Barcode: 41, StockNumber: 7, Price: 3.5});
    prior.BelongedItem = item;
    foreign.BelongedItem = other;
    getRepository(Item).push(other, item);
    getRepository(Sale).push(neighbor, sale);
    getRepository(SalesLineItem).push(prior, foreign);
    service.CurrentSale = sale;
    service.CurrentSaleLine = prior;
    return {service, sale, neighbor, item, other, prior, foreign};
  }

  it('stores exactly one new current line and applies the pre-state stock decrement', () => {
    const {service, sale, neighbor, item, other, prior, foreign} = setup();
    const stockBefore = item.StockNumber;
    expect(service.enterItem(41, 2)).toBe(true);
    const created = getRepository(SalesLineItem).filter(line => line !== prior && line !== foreign);
    expect(getRepository(SalesLineItem)).toHaveLength(3);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(SalesLineItem);
    expect(service.CurrentSaleLine).toBe(created[0]);
    expect(created[0].BelongedSale).toBe(sale);
    expect(sale.ContainedSalesLine).toEqual([prior, created[0]]);
    expect(created[0].BelongedItem).toBe(item);
    expect(created[0].Quantity).toBe(2);
    expect(created[0].Subamount).toBe(7);
    expect(item.StockNumber).toBe(stockBefore - 2);
    expect(other.StockNumber).toBe(12);
    expect(prior.Quantity).toBe(1);
    expect(prior.Subamount).toBe(3.5);
    expect(prior.BelongedSale).toBe(sale);
    expect(prior.BelongedItem).toBe(item);
    expect(neighbor.ContainedSalesLine).toEqual([foreign]);
    expect(foreign.Quantity).toBe(4);
    expect(foreign.Subamount).toBe(8);
    expect(foreign.BelongedSale).toBe(neighbor);
    expect(foreign.BelongedItem).toBe(other);
  });

  it('rejects quantity above available stock (laboratory rule)', () => {
    const {service, sale, item, prior, foreign} = setup();
    const stockBefore = item.StockNumber;
    expectPreconditionRejected(() => service.enterItem(item.Barcode, item.StockNumber + 1));
    expect(getRepository(SalesLineItem)).toEqual([prior, foreign]);
    expect(sale.ContainedSalesLine).toEqual([prior]);
    expect(item.StockNumber).toBe(stockBefore);
    expect(service.CurrentSaleLine).toBe(prior);
  });

  it('accepts quantity equal to available stock (laboratory rule boundary)', () => {
    const {service, sale, item, prior, foreign} = setup();
    const stockBefore = item.StockNumber;
    expect(service.enterItem(item.Barcode, stockBefore)).toBe(true);
    const created = getRepository(SalesLineItem).filter(line => line !== prior && line !== foreign);
    expect(getRepository(SalesLineItem)).toHaveLength(3);
    expect(created).toHaveLength(1);
    expect(created[0].Quantity).toBe(stockBefore);
    expect(created[0].Subamount).toBe(item.Price * stockBefore);
    expect(created[0].BelongedItem).toBe(item);
    expect(created[0].BelongedSale).toBe(sale);
    expect(service.CurrentSaleLine).toBe(created[0]);
    expect(sale.ContainedSalesLine).toEqual([prior, created[0]]);
    expect(item.StockNumber).toBe(0);
  });

  it('rejects absent sale, complete sale, absent item, and zero stock without creating a line', () => {
    const {service, sale, item, prior, foreign} = setup();
    const stockBefore = item.StockNumber;
    service.CurrentSale = undefined as unknown as Sale;
    expectPreconditionRejected(() => service.enterItem(41, 2));
    service.CurrentSale = sale;
    sale.IsComplete = true;
    expectPreconditionRejected(() => service.enterItem(41, 2));
    sale.IsComplete = false;
    expectPreconditionRejected(() => service.enterItem(99, 2));
    item.StockNumber = 0;
    expectPreconditionRejected(() => service.enterItem(41, 2));
    expect(getRepository(SalesLineItem)).toEqual([prior, foreign]);
    expect(sale.ContainedSalesLine).toEqual([prior]);
    expect(item.StockNumber).toBe(0);
    item.StockNumber = stockBefore;
  });
});
