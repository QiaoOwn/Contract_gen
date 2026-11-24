import dayjs from 'dayjs';
import {CashPayment, getRepository, ProcessSaleService, Sale, Store} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ProcessSaleService/makeCashPayment', () => {
  beforeEach(() => {
    clearRepositories(getRepository(CashPayment), getRepository(Sale), getRepository(Store));
  });

  it('Happy Path: records cash payment and completes sale', () => {
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
    expect(getRepository(CashPayment)).toHaveLength(1);
    const payment = getRepository(CashPayment)[0];
    expect(payment.AmountTendered).toBe(2);
    expect(payment.BelongedSale).toBe(service.CurrentSale);
    expect(payment.Balance).toBe(1);
    expect(service.CurrentSale.Time.isSame(dayjs(), 'second')).toBe(true);
  });

  it('rejects when sale is not ready to pay', () => {
    const service = new ProcessSaleService();
    service.CurrentSale = new Sale();
    service.CurrentSale.IsComplete = false;
    service.CurrentSale.IsReadytoPay = false;
    service.CurrentSale.Amount = 1;
    service.CurrentStore = new Store();
    service.CurrentStore.Sales = [];
    expectPreconditionRejected(() => service.makeCashPayment(2));
    expect(getRepository(CashPayment)).toHaveLength(0);
    expect(service.CurrentSale.IsComplete).toBe(false);
  });

  it('rejects when current sale is missing', () => {
    const service = new ProcessSaleService();
    service.CurrentStore = new Store();
    service.CurrentStore.Sales = [];
    expectPreconditionRejected(() => service.makeCashPayment(2));
    expect(getRepository(CashPayment)).toHaveLength(0);
  });
});
