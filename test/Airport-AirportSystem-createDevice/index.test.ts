import {AirportSystem, Device, getRepository, Staff} from './entry';
describe('Airport/AirportSystem/createDevice', () => {
  it('Happy Path', () => {
    const staff = new Staff();
    staff.Id = 1;
    getRepository(Staff).push(staff);
    const service = new AirportSystem();
    const result = service.createDevice(1, 'test', 'test', staff.Id);
    const device = getRepository(Device).find((d) => d.Id === 1);
    expect(result).toBe(true);
    expect(device).toBeDefined();
    expect(device?.Name).toBe('test');
    expect(device?.Location).toBe('test');
    expect(device?.Contacts).toBe(staff);
  });
});
