import {ProcessSaleService, Sale, SalesLineItem, getRepository} from './entry';

// Evaluation-only R03 totals: numeric values on different line objects are not deduplicated.
describe('R03 sales-line amount and numeric result', () => {
  beforeEach(() => {getRepository(Sale).splice(0); getRepository(SalesLineItem).splice(0);});
  it.each([
    {before: 92, subtotals: [3, 8], expected: 11},
    {before: 92, subtotals: [7, 7], expected: 14},
    {before: 92, subtotals: [], expected: 0},
    {before: 92, subtotals: [1.25, 2.5], expected: 3.75},
  ])('replaces rather than increments the amount and returns that total: %j', example => {
    const sale = Object.assign(new Sale(), {Amount: example.before, IsComplete: false, IsReadytoPay: false});
    sale.ContainedSalesLine = example.subtotals.map(value => Object.assign(new SalesLineItem(), {Subamount: value}));
    getRepository(Sale).push(sale);
    getRepository(SalesLineItem).push(...sale.ContainedSalesLine);
    const service = new ProcessSaleService(); service.CurrentSale = sale;
    expect(service.endSale()).toBe(example.expected);
    expect(sale.Amount).toBe(example.expected);
    expect(sale.IsReadytoPay).toBe(true);
  });
  it('rejects a missing current Sale', () => {
    expect(() => new ProcessSaleService().endSale()).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
  it.each([{complete: true, ready: false}, {complete: false, ready: true}])('rejects a source-ineligible Sale: %j', flags => {
    const service = new ProcessSaleService();
    service.CurrentSale = Object.assign(new Sale(), {IsComplete: flags.complete, IsReadytoPay: flags.ready, Amount: 9, ContainedSalesLine: []});
    expect(() => service.endSale()).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
});
