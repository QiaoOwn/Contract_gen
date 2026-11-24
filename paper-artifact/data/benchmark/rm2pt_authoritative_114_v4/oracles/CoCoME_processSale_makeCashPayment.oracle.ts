import {CashPayment, ProcessSaleService, Sale, Store, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME makeCashPayment, approved CurrentStore guard', () => {
  beforeEach(() => clearRepositories(getRepository(CashPayment), getRepository(Sale), getRepository(Store)));

  function setup() {
    const service = new ProcessSaleService();
    const priorPayment = Object.assign(new CashPayment(), {
      AmountTendered: 1,
      Balance: 0,
    });
    const neighborSale = Object.assign(new Sale(), {
      Amount: 2,
      IsComplete: true,
      IsReadytoPay: true,
      Time: new Date('2025-01-01T00:00:00.000Z'),
    });
    const sale = Object.assign(new Sale(), {
      Amount: 6.5,
      IsComplete: false,
      IsReadytoPay: true,
    });
    const store = Object.assign(new Store(), {Id: 8, Sales: [neighborSale] as Sale[]});
    const otherStore = Object.assign(new Store(), {Id: 9, Sales: [] as Sale[]});
    neighborSale.Belongedstore = store;
    getRepository(CashPayment).push(priorPayment);
    getRepository(Sale).push(neighborSale, sale);
    getRepository(Store).push(store, otherStore);
    service.CurrentSale = sale;
    service.CurrentStore = store;
    return {service, sale, store, otherStore, neighborSale, priorPayment};
  }

  it.each([[6.5, 0], [10, 3.5]])('records tender %s and change %s', (tendered, balance) => {
    const now = new Date('2026-01-15T12:00:00.789+08:00');
    jest.useFakeTimers().setSystemTime(now);
    try {
      const {service, sale, store, otherStore, neighborSale, priorPayment} = setup();
      expect(service.makeCashPayment(tendered)).toBe(true);
      const created = getRepository(CashPayment).filter(payment => payment !== priorPayment);
      expect(getRepository(CashPayment)).toHaveLength(2);
      expect(created).toHaveLength(1);
      expect(created[0]).toBeInstanceOf(CashPayment);
      expect(created[0].AmountTendered).toBe(tendered);
      expect(created[0].Balance).toBe(balance);
      expect(created[0].BelongedSale).toBe(sale);
      expect(sale.AssoicatedPayment).toBe(created[0]);
      expect(sale.Belongedstore).toBe(store);
      expect(store.Sales).toEqual([neighborSale, sale]);
      expect(sale.IsComplete).toBe(true);
      expect(sale.Time.valueOf()).toBe(now.valueOf());
      expect(neighborSale.IsComplete).toBe(true);
      expect(neighborSale.Amount).toBe(2);
      expect(neighborSale.Belongedstore).toBe(store);
      expect(neighborSale.Time.valueOf()).toBe(new Date('2025-01-01T00:00:00.000Z').valueOf());
      expect(otherStore.Sales).toEqual([]);
      expect(priorPayment.AmountTendered).toBe(1);
      expect(priorPayment.Balance).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects missing sale, completed sale, unready sale, insufficient tender and missing store', () => {
    const {service, sale, store, neighborSale, priorPayment} = setup();
    service.CurrentSale = undefined as unknown as Sale;
    expectPreconditionRejected(() => service.makeCashPayment(10));
    service.CurrentSale = sale;
    sale.IsComplete = true;
    expectPreconditionRejected(() => service.makeCashPayment(10));
    sale.IsComplete = false;
    sale.IsReadytoPay = false;
    expectPreconditionRejected(() => service.makeCashPayment(10));
    sale.IsReadytoPay = true;
    expectPreconditionRejected(() => service.makeCashPayment(5));
    service.CurrentStore = undefined as unknown as Store;
    expectPreconditionRejected(() => service.makeCashPayment(10));
    service.CurrentStore = store;
    expect(getRepository(CashPayment)).toEqual([priorPayment]);
    expect(sale.IsComplete).toBe(false);
    expect(sale.AssoicatedPayment).toBeUndefined();
    expect(store.Sales).toEqual([neighborSale]);
  });
});
