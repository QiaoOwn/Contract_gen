import {CashDesk, Store, CoCoMESystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned closeCashDesk: required state transition', () => {
  beforeEach(() => {
    getRepository(CashDesk).splice(0);
    getRepository(Store).splice(0);
  });
  const seed = (id = 7204) => {
    const target = Object.assign(new CashDesk(), {Id: id, IsOpened: true});
    const other = Object.assign(new CashDesk(), {Id: 7305, IsOpened: true});
    getRepository(CashDesk).push(other, target);
    const service = new CoCoMESystem();
    service.CurrentStore = Object.assign(new Store(), {Id: 8100, IsOpened: true});
    service.CurrentCashDesk = other;
    return {target, service};
  };
  const run = (id: number) => {
    const {target, service} = seed(id);
    expect(service.closeCashDesk(id)).toBe(true);
    expect(target.IsOpened).toBe(false);
    expect(service.CurrentCashDesk).toBe(target);
  };
  it('performs the required transition on the selected object', () => run(7204));
  it('accepts an existing negative identifier', () => run(-7205));
  it('accepts an existing zero identifier', () => run(0));
  it('rejects a missing target among other records', () => {
    const {service} = seed();
    expectPreconditionRejected(() => service.closeCashDesk(9999));
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

