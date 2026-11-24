import {ProcessSaleService, CashDesk, Sale, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned fresh sale with desk and repository links', () => {
  beforeEach(() => {getRepository(Sale).splice(0); getRepository(CashDesk).splice(0);});
  it.each([{previous: false, neighbor: false, ready: false}, {previous: true, neighbor: false, ready: false},
    {previous: false, neighbor: true, ready: false}, {previous: true, neighbor: true, ready: false},
    {previous: true, neighbor: false, ready: true}])('creates a sale with prior session %j', ({previous, neighbor, ready}) => {
    const service = new ProcessSaleService();
    const old = Object.assign(new Sale(), {IsComplete: true, IsReadytoPay: ready});
    const other = Object.assign(new Sale(), {IsComplete: true});
    const desk = Object.assign(new CashDesk(), {Id: 912, IsOpened: true, ContainedSales: neighbor ? [other] : []});
    service.CurrentCashDesk = desk;
    if (previous) {service.CurrentSale = old; getRepository(Sale).push(old);}
    if (neighbor) getRepository(Sale).push(other);
    const before = new Set([old, other, ...getRepository(Sale)]);
    expect(service.makeNewSale()).toBe(true);
    const created = getRepository(Sale).find(object => !before.has(object)) ?? service.CurrentSale;
    expect(created).toBeInstanceOf(Sale);
    expect(before.has(created)).toBe(false);
    expect(created.BelongedCashDesk === desk).toBe(true);
    expect(desk.ContainedSales.includes(created)).toBe(true);
    expect(created.IsComplete).toBe(false);
    expect(created.IsReadytoPay).toBe(false);
    expect(getRepository(Sale).includes(created)).toBe(true);
    expect(service.CurrentSale === created).toBe(true);
  });
  it('rejects a missing current desk', () => expectPreconditionRejected(() => new ProcessSaleService().makeNewSale()));
  it('rejects a closed desk', () => {
    const service = new ProcessSaleService();
    service.CurrentCashDesk = Object.assign(new CashDesk(), {IsOpened: false, ContainedSales: []});
    expectPreconditionRejected(() => service.makeNewSale());
  });
  it('rejects an existing incomplete current sale', () => {
    const service = new ProcessSaleService();
    service.CurrentCashDesk = Object.assign(new CashDesk(), {IsOpened: true, ContainedSales: []});
    service.CurrentSale = Object.assign(new Sale(), {IsComplete: false, IsReadytoPay: true});
    expectPreconditionRejected(() => service.makeNewSale());
  });
});
