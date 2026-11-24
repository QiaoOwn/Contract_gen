import {CashDesk, ProcessSaleService, Sale, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ProcessSaleService/makeNewSale', () => {
  beforeEach(() => clearRepositories(getRepository(Sale), getRepository(CashDesk)));

  it.each([
    {previous: false, neighbor: false, ready: false},
    {previous: true, neighbor: false, ready: false},
    {previous: false, neighbor: true, ready: false},
    {previous: true, neighbor: true, ready: false},
    {previous: true, neighbor: false, ready: true},
  ])('creates exactly one incomplete Sale linked to the open desk: %j', ({previous, neighbor, ready}) => {
    const previousSale = Object.assign(new Sale(), {
      IsComplete: true,
      IsReadytoPay: ready,
      Amount: 41,
    });
    const neighborSale = Object.assign(new Sale(), {
      IsComplete: true,
      IsReadytoPay: false,
      Amount: 9,
    });
    const desk = Object.assign(new CashDesk(), {
      Id: 912,
      IsOpened: true,
      ContainedSales: neighbor ? [neighborSale] : [],
    });
    getRepository(CashDesk).push(desk);
    if (previous) getRepository(Sale).push(previousSale);
    if (neighbor) getRepository(Sale).push(neighborSale);
    const service = new ProcessSaleService();
    service.CurrentCashDesk = desk;
    if (previous) service.CurrentSale = previousSale;
    const beforeCount = getRepository(Sale).length;
    expect(service.makeNewSale()).toBe(true);
    const retained = [previousSale, neighborSale].filter(sale => getRepository(Sale).includes(sale));
    const created = getRepository(Sale).filter(sale => sale !== previousSale && sale !== neighborSale);
    expect(getRepository(Sale)).toHaveLength(beforeCount + 1);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Sale);
    expect(created[0].BelongedCashDesk).toBe(desk);
    expect(desk.ContainedSales).toContain(created[0]);
    expect(created[0].IsComplete).toBe(false);
    expect(created[0].IsReadytoPay).toBe(false);
    expect(service.CurrentSale).toBe(created[0]);
    if (previous) {
      expect(retained).toContain(previousSale);
      expect(previousSale.IsComplete).toBe(true);
      expect(previousSale.IsReadytoPay).toBe(ready);
      expect(previousSale.Amount).toBe(41);
    }
    if (neighbor) {
      expect(retained).toContain(neighborSale);
      expect(neighborSale.IsComplete).toBe(true);
      expect(neighborSale.Amount).toBe(9);
      expect(desk.ContainedSales).toContain(neighborSale);
    }
  });

  it('rejects a missing current desk without adding a Sale', () => {
    expectPreconditionRejected(() => new ProcessSaleService().makeNewSale());
    expect(getRepository(Sale)).toHaveLength(0);
  });

  it('rejects a closed desk without adding a Sale', () => {
    const desk = Object.assign(new CashDesk(), {Id: 3, IsOpened: false, ContainedSales: []});
    getRepository(CashDesk).push(desk);
    const service = new ProcessSaleService();
    service.CurrentCashDesk = desk;
    expectPreconditionRejected(() => service.makeNewSale());
    expect(getRepository(Sale)).toHaveLength(0);
    expect(desk.ContainedSales).toEqual([]);
  });

  it('rejects an incomplete current Sale without growing the repository', () => {
    const incomplete = Object.assign(new Sale(), {
      IsComplete: false,
      IsReadytoPay: true,
      Amount: 17,
    });
    const desk = Object.assign(new CashDesk(), {Id: 4, IsOpened: true, ContainedSales: [incomplete]});
    getRepository(CashDesk).push(desk);
    getRepository(Sale).push(incomplete);
    const service = new ProcessSaleService();
    service.CurrentCashDesk = desk;
    service.CurrentSale = incomplete;
    expectPreconditionRejected(() => service.makeNewSale());
    expect(getRepository(Sale)).toEqual([incomplete]);
    expect(service.CurrentSale).toBe(incomplete);
    expect(incomplete.IsComplete).toBe(false);
    expect(incomplete.IsReadytoPay).toBe(true);
    expect(incomplete.Amount).toBe(17);
    expect(desk.ContainedSales).toEqual([incomplete]);
  });
});
