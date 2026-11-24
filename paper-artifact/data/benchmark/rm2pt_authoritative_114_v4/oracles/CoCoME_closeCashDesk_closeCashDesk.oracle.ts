import {CashDesk, Store, CoCoMESystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/closeCashDesk/closeCashDesk', () => {
  beforeEach(() => {
    getRepository(CashDesk).splice(0);
    getRepository(Store).splice(0);
  });

  const seed = (id = 7204) => {
    const neighbor = Object.assign(new CashDesk(), {Id: 7305, IsOpened: true});
    const target = Object.assign(new CashDesk(), {Id: id, IsOpened: true});
    getRepository(CashDesk).push(neighbor, target);
    const service = new CoCoMESystem();
    service.CurrentStore = Object.assign(new Store(), {Id: 8100, IsOpened: true});
    service.CurrentCashDesk = neighbor;
    return {neighbor, target, service};
  };

  it.each([7204, -7205, 0])(
    'closes only the selected CashDesk %j and keeps the neighbor open',
    id => {
      const {neighbor, target, service} = seed(id);
      expect(service.closeCashDesk(id)).toBe(true);
      expect(getRepository(CashDesk)).toEqual([neighbor, target]);
      expect(target.Id).toBe(id);
      expect(target.IsOpened).toBe(false);
      expect(service.CurrentCashDesk).toBe(target);
      expect(neighbor.Id).toBe(7305);
      expect(neighbor.IsOpened).toBe(true);
      expect(service.CurrentStore.Id).toBe(8100);
      expect(service.CurrentStore.IsOpened).toBe(true);
    },
  );

  it('rejects a missing target among other records without mutating them', () => {
    const {neighbor, target, service} = seed();
    expectPreconditionRejected(() => service.closeCashDesk(9999));
    expect(getRepository(CashDesk)).toEqual([neighbor, target]);
    expect(neighbor.IsOpened).toBe(true);
    expect(target.IsOpened).toBe(true);
    expect(service.CurrentCashDesk).toBe(neighbor);
  });

  it('rejects the wrong entry state', () => {
    const {target, service} = seed();
    target.IsOpened = false;
    expectPreconditionRejected(() => service.closeCashDesk(7204));
  });

  it('rejects an empty target repository', () => {
    const {service} = seed();
    getRepository(CashDesk).splice(0);
    expectPreconditionRejected(() => service.closeCashDesk(7204));
  });

  it('rejects an undefined current store', () => {
    const {service} = seed();
    service.CurrentStore = undefined as unknown as Store;
    expectPreconditionRejected(() => service.closeCashDesk(7204));
  });

  it('rejects a closed current store', () => {
    const {service} = seed();
    service.CurrentStore.IsOpened = false;
    expectPreconditionRejected(() => service.closeCashDesk(7204));
  });
});
