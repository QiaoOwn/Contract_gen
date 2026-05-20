import {CashPayment, getRepository, ProcessSaleService, Sale, Store} from './entry';
describe('CoCoME/ProcessSaleService/makeCashPayment', () => {
  it('Happy Path', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = false;
    service.CurrentSale.IsReadytoPay = true;
    service.CurrentSale.Amount = 1;
    service.CurrentStore = new Store();
    service.CurrentStore.Sales = [];
    const result = service.makeCashPayment(2);
    expect(result).toBe(true);
    expect(service.CurrentSale.AssoicatedPayment).toBeDefined();
    expect(service.CurrentSale.Belongedstore).toBe(service.CurrentStore);
    expect(service.CurrentStore.Sales).toContain(service.CurrentSale);
    expect(service.CurrentSale.IsComplete).toBe(true);
    expect(getRepository(CashPayment).length).toBe(1);
  });
});
