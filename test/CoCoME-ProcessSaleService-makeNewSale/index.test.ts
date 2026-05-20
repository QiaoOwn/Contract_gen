import {CashDesk, getRepository, ProcessSaleService, Sale} from './entry';
describe('CoCoME/ProcessSaleService/makeNewSale', () => {
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
});
