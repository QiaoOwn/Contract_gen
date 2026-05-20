import {AirportSystem, getRepository, Staff} from './entry';
describe('Airport/AirportSystem/createStaff', () => {
  it('Happy Path', () => {
    const service = new AirportSystem();
    const result = service.createStaff(1, 'test', 'test', '13344442222', 1, 1);
    const staff = getRepository(Staff).find((s) => s.Id === 1);
    expect(result).toBe(true);
    expect(staff).toBeDefined();
    expect(staff?.Name).toBe('test');
    expect(staff?.Password).toBe('test');
    expect(staff?.Phone).toBe('13344442222');
    expect(staff?.Role).toBe(1);
  });
});
