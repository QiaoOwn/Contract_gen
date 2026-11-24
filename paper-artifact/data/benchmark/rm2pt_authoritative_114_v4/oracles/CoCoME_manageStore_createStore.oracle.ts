import {ManageStoreCRUDService, Store, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageStoreCRUDService/createStore', () => {
  beforeEach(() => clearRepositories(getRepository(Store)));

  it('creates exactly one stored Store with the supplied fields', () => {
    const neighbor = Object.assign(new Store(), {
      Id: 2,
      Name: 'neighbor',
      Address: 'neighbor-address',
      IsOpened: false,
    });
    getRepository(Store).push(neighbor);
    expect(new ManageStoreCRUDService().createStore(1, 'testname', 'testlocation', true)).toBe(true);
    const created = getRepository(Store).filter(item => item !== neighbor);
    expect(getRepository(Store)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Store);
    expect(created[0].Id).toBe(1);
    expect(created[0].Name).toBe('testname');
    expect(created[0].Address).toBe('testlocation');
    expect(created[0].IsOpened).toBe(true);
    expect(getRepository(Store)).toContain(neighbor);
  });

  it('rejects a duplicate ID without adding or replacing a Store', () => {
    const existing = Object.assign(new Store(), {
      Id: 1,
      Name: 'original',
      Address: 'original-address',
      IsOpened: false,
    });
    getRepository(Store).push(existing);
    expectPreconditionRejected(() =>
      new ManageStoreCRUDService().createStore(1, 'testname', 'testlocation', true)
    );
    expect(getRepository(Store)).toEqual([existing]);
    expect(existing.Name).toBe('original');
    expect(existing.Address).toBe('original-address');
    expect(existing.IsOpened).toBe(false);
  });
});
