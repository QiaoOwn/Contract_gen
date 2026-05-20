import {getRepository, Item, ProcessSaleService, Sale} from './entry';
describe('CoCoME/ProcessSaleService/enterItem', () => {
  it('Happy Path', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.ContainedSalesLine = [];
    service.CurrentSale.IsComplete = false;
    const item = new Item();
    item.Barcode = 1;
    item.StockNumber = 2;
    getRepository(Item).push(item);
    const result = service.enterItem(1, 1);
    expect(result).toBe(true);
    expect(service.CurrentSaleLine).toBeDefined();
    expect(service.CurrentSaleLine.BelongedSale).toBe(service.CurrentSale);
  });
});
