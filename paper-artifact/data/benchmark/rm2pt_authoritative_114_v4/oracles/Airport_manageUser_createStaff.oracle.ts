import {AirportSystem, getRepository, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/AirportSystem/createStaff', () => {
  beforeEach(() => clearRepositories(getRepository(Staff)));

  it('creates and stores exactly one Staff member without a matching boss', () => {
    const result = new AirportSystem().createStaff(1, 'alice', 'secret', '13344442222', 1, 99);
    const stored = getRepository(Staff);
    expect(result).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toBeInstanceOf(Staff);
    expect(stored[0].Id).toBe(1);
    expect(stored[0].Name).toBe('alice');
    expect(stored[0].Password).toBe('secret');
    expect(stored[0].Phone).toBe('13344442222');
    expect(stored[0].Role).toBe(1);
  });

  it('links the new Staff member to the existing boss', () => {
    const boss = Object.assign(new Staff(), {Id: 2});
    getRepository(Staff).push(boss);
    const result = new AirportSystem().createStaff(1, 'alice', 'secret', '13344442222', 1, boss.Id);
    const created = getRepository(Staff).filter(item => item !== boss);
    expect(result).toBe(true);
    expect(getRepository(Staff)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0].Id).toBe(1);
    expect(created[0].Boss).toBe(boss);
  });

  it('rejects a used identifier without creating or replacing Staff', () => {
    const existing = Object.assign(new Staff(), {Id: 1});
    getRepository(Staff).push(existing);
    expectPreconditionRejected(() =>
      new AirportSystem().createStaff(1, 'alice', 'secret', '13344442222', 1, 99)
    );
    expect(getRepository(Staff)).toEqual([existing]);
  });
});
