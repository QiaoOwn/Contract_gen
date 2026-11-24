import {ManageStoreCRUDService, Store, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageStoreCRUDService/deleteStore', () => {
  beforeEach(() => clearRepositories(getRepository(Store)));

  it('removes the selected Store, preserves its neighbor, and returns true', () => {
    const target = Object.assign(new Store(), {
      Id: 1,
      Name: 'target',
      Address: 'target-address',
      IsOpened: true,
    });
    const neighbor = Object.assign(new Store(), {
      Id: 2,
      Name: 'neighbor',
      Address: 'neighbor-address',
      IsOpened: false,
    });
    getRepository(Store).push(target, neighbor);
    expect(new ManageStoreCRUDService().deleteStore(1)).toBe(true);
    expect(getRepository(Store)).toEqual([neighbor]);
  });

  it('rejects a missing ID without removing another Store', () => {
    const neighbor = Object.assign(new Store(), {
      Id: 2,
      Name: 'neighbor',
      Address: 'neighbor-address',
      IsOpened: true,
    });
    getRepository(Store).push(neighbor);
    expectPreconditionRejected(() => new ManageStoreCRUDService().deleteStore(99));
    expect(getRepository(Store)).toEqual([neighbor]);
  });
});
