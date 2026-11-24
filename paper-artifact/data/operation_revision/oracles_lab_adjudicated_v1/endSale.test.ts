import {
  ProcessSaleService,
  Sale,
  SalesLineItem,
  getRepository,
} from '../../../test/CoCoME-ProcessSaleService-endSale/entry';
import {clearRepositories} from '../../../test/helpers/contractOracle';

describe('lab adjudication: endSale', () => {
  beforeEach(() => clearRepositories(getRepository(Sale), getRepository(SalesLineItem)));

  it('counts two different sales lines with equal subtotals', () => {
    const service = new ProcessSaleService();
    const sale = new Sale();
    sale.IsComplete = false;
    sale.IsReadytoPay = false;
    const first = new SalesLineItem();
    first.Subamount = 20;
    const second = new SalesLineItem();
    second.Subamount = 20;
    sale.ContainedSalesLine = [first, second];
    service.CurrentSale = sale;

    expect(service.endSale()).toBe(40);
    expect(sale.Amount).toBe(40);
    expect(sale.IsReadytoPay).toBe(true);
  });
});
