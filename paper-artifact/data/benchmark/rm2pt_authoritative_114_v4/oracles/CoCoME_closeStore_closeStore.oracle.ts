import {Store, CoCoMESystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/closeStore/closeStore', () => {
  beforeEach(() => {
    getRepository(Store).splice(0);
  });

  const seed = (id = 7204) => {
    const neighbor = Object.assign(new Store(), {Id: 7305, IsOpened: true});
    const target = Object.assign(new Store(), {Id: id, IsOpened: true});
    getRepository(Store).push(neighbor, target);
    const service = new CoCoMESystem();
    return {neighbor, target, service};
  };

  it.each([7204, -7205, 0])(
    'closes only the selected Store %j and keeps the neighbor open',
    id => {
      const {neighbor, target, service} = seed(id);
      expect(service.closeStore(id)).toBe(true);
      expect(getRepository(Store)).toEqual([neighbor, target]);
      expect(target.Id).toBe(id);
      expect(target.IsOpened).toBe(false);
      expect(neighbor.Id).toBe(7305);
      expect(neighbor.IsOpened).toBe(true);
    },
  );

  it('rejects a missing target among other records without mutating them', () => {
    const {neighbor, target, service} = seed();
    expectPreconditionRejected(() => service.closeStore(9999));
    expect(getRepository(Store)).toEqual([neighbor, target]);
    expect(neighbor.IsOpened).toBe(true);
    expect(target.IsOpened).toBe(true);
  });

  it('rejects the wrong entry state', () => {
    const {target, service} = seed();
    target.IsOpened = false;
    expectPreconditionRejected(() => service.closeStore(7204));
  });

  it('rejects an empty target repository', () => {
    const {service} = seed();
    getRepository(Store).splice(0);
    expectPreconditionRejected(() => service.closeStore(7204));
  });
});
