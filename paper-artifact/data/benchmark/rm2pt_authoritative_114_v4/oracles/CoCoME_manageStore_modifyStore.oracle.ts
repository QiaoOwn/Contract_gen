import {ManageStoreCRUDService, Store, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageStoreCRUDService/modifyStore', () => {
  beforeEach(() => clearRepositories(getRepository(Store)));

  it('updates only the selected Store and returns true', () => {
    const target = Object.assign(new Store(), {
      Id: 1,
      Name: 'old',
      Address: 'old-address',
      IsOpened: true,
    });
    const neighbor = Object.assign(new Store(), {
      Id: 2,
      Name: 'neighbor',
      Address: 'neighbor-address',
      IsOpened: false,
    });
    getRepository(Store).push(target, neighbor);
    expect(new ManageStoreCRUDService().modifyStore(1, 'modifiedName', 'modifiedAddress', false)).toBe(true);
    expect(getRepository(Store)).toEqual([target, neighbor]);
    expect(target.Id).toBe(1);
    expect(target.Name).toBe('modifiedName');
    expect(target.Address).toBe('modifiedAddress');
    expect(target.IsOpened).toBe(false);
    expect(neighbor.Name).toBe('neighbor');
    expect(neighbor.Address).toBe('neighbor-address');
    expect(neighbor.IsOpened).toBe(false);
  });

  it('rejects a missing ID without changing another Store', () => {
    const neighbor = Object.assign(new Store(), {
      Id: 2,
      Name: 'neighbor',
      Address: 'neighbor-address',
      IsOpened: true,
    });
    getRepository(Store).push(neighbor);
    expectPreconditionRejected(() =>
      new ManageStoreCRUDService().modifyStore(99, 'modifiedName', 'modifiedAddress', false)
    );
    expect(getRepository(Store)).toEqual([neighbor]);
    expect(neighbor.Name).toBe('neighbor');
    expect(neighbor.Address).toBe('neighbor-address');
    expect(neighbor.IsOpened).toBe(true);
  });
});
