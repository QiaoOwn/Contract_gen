import {ProcessSaleService, Sale, SalesLineItem} from './entry';
describe('CoCoME/ProcessSaleService/endSale', () => {
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
});
