import {ProcessSaleService, Sale, SalesLineItem, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

// R03: distinct SalesLineItem objects contribute separately, including equal Subamount values.
describe('CoCoME/ProcessSaleService/endSale', () => {
  beforeEach(() => clearRepositories(getRepository(Sale), getRepository(SalesLineItem)));

  it.each([
    {before: 92, subtotals: [3, 8], expected: 11},
    {before: 92, subtotals: [7, 7], expected: 14},
    {before: 92, subtotals: [], expected: 0},
    {before: 92, subtotals: [1.25, 2.5], expected: 3.75},
  ])('replaces rather than increments the amount and returns that total: %j', example => {
    const lines = example.subtotals.map(value =>
      Object.assign(new SalesLineItem(), {Subamount: value, Quantity: 1})
    );
    const sale = Object.assign(new Sale(), {
      Amount: example.before,
      IsComplete: false,
      IsReadytoPay: false,
      ContainedSalesLine: lines,
    });
    const neighborLines = [
      Object.assign(new SalesLineItem(), {Subamount: 50, Quantity: 2}),
    ];
    const neighbor = Object.assign(new Sale(), {
      Amount: 50,
      IsComplete: false,
      IsReadytoPay: false,
      ContainedSalesLine: neighborLines,
    });
    for (const line of lines) line.BelongedSale = sale;
    neighborLines[0].BelongedSale = neighbor;
    getRepository(Sale).push(neighbor, sale);
    getRepository(SalesLineItem).push(...neighborLines, ...lines);
    const service = new ProcessSaleService();
    service.CurrentSale = sale;
    expect(service.endSale()).toBe(example.expected);
    expect(sale.Amount).toBe(example.expected);
    expect(sale.IsReadytoPay).toBe(true);
    expect(sale.IsComplete).toBe(false);
    expect(sale.ContainedSalesLine).toEqual(lines);
    expect(lines.map(line => line.Subamount)).toEqual(example.subtotals);
    expect(neighbor.Amount).toBe(50);
    expect(neighbor.IsReadytoPay).toBe(false);
    expect(neighbor.ContainedSalesLine).toEqual(neighborLines);
    expect(neighborLines[0].Subamount).toBe(50);
  });

  it('rejects a missing current Sale', () => {
    expectPreconditionRejected(() => new ProcessSaleService().endSale());
  });

  it('rejects a completed Sale without changing readiness or amount', () => {
    const sale = Object.assign(new Sale(), {
      Amount: 9,
      IsComplete: true,
      IsReadytoPay: false,
      ContainedSalesLine: [],
    });
    getRepository(Sale).push(sale);
    const service = new ProcessSaleService();
    service.CurrentSale = sale;
    expectPreconditionRejected(() => service.endSale());
    expect(sale.Amount).toBe(9);
    expect(sale.IsReadytoPay).toBe(false);
    expect(sale.IsComplete).toBe(true);
  });

  it('rejects an already payment-ready Sale without changing its amount', () => {
    const sale = Object.assign(new Sale(), {
      Amount: 9,
      IsComplete: false,
      IsReadytoPay: true,
      ContainedSalesLine: [],
    });
    getRepository(Sale).push(sale);
    const service = new ProcessSaleService();
    service.CurrentSale = sale;
    expectPreconditionRejected(() => service.endSale());
    expect(sale.Amount).toBe(9);
    expect(sale.IsReadytoPay).toBe(true);
    expect(sale.IsComplete).toBe(false);
  });
});
