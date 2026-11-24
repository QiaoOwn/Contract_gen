import {Store, CoCoMESystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned openStore: required state transition', () => {
  beforeEach(() => {
    getRepository(Store).splice(0);
  });
  const seed = (id = 7204) => {
    const target = Object.assign(new Store(), {Id: id, IsOpened: false});
    const other = Object.assign(new Store(), {Id: 7305, IsOpened: false});
    getRepository(Store).push(other, target);
    const service = new CoCoMESystem();
    service.CurrentStore = other;
    return {target, service};
  };
  const run = (id: number) => {
    const {target, service} = seed(id);
    expect(service.openStore(id)).toBe(true);
    expect(target.IsOpened).toBe(true);
    expect(service.CurrentStore).toBe(target);
  };
  it('performs the required transition on the selected object', () => run(7204));
  it('accepts an existing negative identifier', () => run(-7205));
  it('accepts an existing zero identifier', () => run(0));
  it('rejects a missing target among other records', () => {
    const {service} = seed();
    expectPreconditionRejected(() => service.openStore(9999));
  });
  it('rejects the wrong entry state', () => {
    const {target, service} = seed();
    target.IsOpened = true;
    expectPreconditionRejected(() => service.openStore(7204));
  });
  it('rejects an empty target repository', () => {
    const {service} = seed();
    getRepository(Store).splice(0);
    expectPreconditionRejected(() => service.openStore(7204));
  });
});

