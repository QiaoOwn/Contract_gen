import {AirportSystem, Device, getRepository, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/AirportSystem/createDevice', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Staff), getRepository(Device));
  });

  it('Happy Path: creates device linked to staff and returns true', () => {
    const staff = new Staff();
    staff.Id = 1;
    getRepository(Staff).push(staff);
    const service = new AirportSystem();
    const result = service.createDevice(1, 'radar', 'T1', staff.Id);
    const device = getRepository(Device).find((d) => d.Id === 1);
    expect(result).toBe(true);
    expect(device).toBeDefined();
    expect(device?.Name).toBe('radar');
    expect(device?.Location).toBe('T1');
    expect(device?.Contacts).toBe(staff);
    expect(getRepository(Device)).toContain(device);
  });

  it('rejects when device identifier is already used', () => {
    const staff = new Staff();
    staff.Id = 1;
    getRepository(Staff).push(staff);
    const existing = new Device();
    existing.Id = 1;
    existing.Contacts = staff;
    getRepository(Device).push(existing);
    const service = new AirportSystem();
    expectPreconditionRejected(() => service.createDevice(1, 'radar', 'T1', staff.Id));
    expect(getRepository(Device)).toHaveLength(1);
    expect(getRepository(Device)[0]).toBe(existing);
  });

  it('rejects when contact staff does not exist', () => {
    const service = new AirportSystem();
    expectPreconditionRejected(() => service.createDevice(1, 'radar', 'T1', 99));
    expect(getRepository(Device)).toHaveLength(0);
  });
});
