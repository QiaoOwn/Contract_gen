import {
  CashPayment,
  ProcessSaleService,
  Sale,
  getRepository,
} from './makeCashPayment.reference';
import {clearRepositories, expectPreconditionRejected} from '../../../test/helpers/contractOracle';

describe('lab adjudication: makeCashPayment', () => {
  beforeEach(() => clearRepositories(getRepository(CashPayment), getRepository(Sale)));

  it('rejects a missing current store without payment or sale effects', () => {
    const service = new ProcessSaleService();
    const sale = new Sale();
    sale.IsComplete = false;
    sale.IsReadytoPay = true;
    sale.Amount = 10;
    service.CurrentSale = sale;

    expectPreconditionRejected(() => service.makeCashPayment(12));
    expect(getRepository(CashPayment)).toHaveLength(0);
    expect(sale.IsComplete).toBe(false);
    expect(sale.IsReadytoPay).toBe(true);
    expect(sale.Amount).toBe(10);
  });
});
