import {Store, CoCoMESystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/openStore/openStore', () => {
  beforeEach(() => {
    getRepository(Store).splice(0);
  });

  const seed = (id = 7204) => {
    const neighbor = Object.assign(new Store(), {Id: 7305, IsOpened: false});
    const target = Object.assign(new Store(), {Id: id, IsOpened: false});
    getRepository(Store).push(neighbor, target);
    const service = new CoCoMESystem();
    service.CurrentStore = neighbor;
    return {neighbor, target, service};
  };

  it.each([7204, -7205, 0])(
    'opens only the selected Store %j and keeps the neighbor closed',
    id => {
      const {neighbor, target, service} = seed(id);
      expect(service.openStore(id)).toBe(true);
      expect(getRepository(Store)).toEqual([neighbor, target]);
      expect(target.Id).toBe(id);
      expect(target.IsOpened).toBe(true);
      expect(service.CurrentStore).toBe(target);
      expect(neighbor.Id).toBe(7305);
      expect(neighbor.IsOpened).toBe(false);
    },
  );

  it('rejects a missing target among other records without mutating them', () => {
    const {neighbor, target, service} = seed();
    expectPreconditionRejected(() => service.openStore(9999));
    expect(getRepository(Store)).toEqual([neighbor, target]);
    expect(neighbor.IsOpened).toBe(false);
    expect(target.IsOpened).toBe(false);
    expect(service.CurrentStore).toBe(neighbor);
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
