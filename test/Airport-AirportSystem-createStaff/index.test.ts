import {AirportSystem, getRepository, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/AirportSystem/createStaff', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Staff));
  });

  it('Happy Path: creates staff without boss and returns true', () => {
    const service = new AirportSystem();
    const result = service.createStaff(1, 'alice', 'secret', '13344442222', 1, 99);
    const staff = getRepository(Staff).find((s) => s.Id === 1);
    expect(result).toBe(true);
    expect(staff).toBeDefined();
    expect(staff?.Name).toBe('alice');
    expect(staff?.Password).toBe('secret');
    expect(staff?.Phone).toBe('13344442222');
    expect(staff?.Role).toBe(1);
    expect(staff?.Boss).toBeUndefined();
  });

  it('Happy Path: links boss when the referenced staff exists', () => {
    const boss = new Staff();
    boss.Id = 2;
    getRepository(Staff).push(boss);
    const service = new AirportSystem();
    const result = service.createStaff(1, 'alice', 'secret', '13344442222', 1, boss.Id);
    const staff = getRepository(Staff).find((s) => s.Id === 1);
    expect(result).toBe(true);
    expect(staff?.Boss).toBe(boss);
  });

  it('rejects when staff identifier is already used', () => {
    const existing = new Staff();
    existing.Id = 1;
    getRepository(Staff).push(existing);
    const service = new AirportSystem();
    expectPreconditionRejected(() =>
      service.createStaff(1, 'alice', 'secret', '13344442222', 1, 99)
    );
    expect(getRepository(Staff)).toHaveLength(1);
    expect(getRepository(Staff)[0]).toBe(existing);
  });
});
