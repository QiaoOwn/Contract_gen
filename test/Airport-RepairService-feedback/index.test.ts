import {Device, getRepository, Repair, RepairService, Staff} from './entry';
describe('Airport/RepairService/feedback', () => {
  it('Happy Path', () => {
    const staff = new Staff();
    staff.Id = 1;
    staff.Role = 0;
    const repair = new Repair();
    repair.Id = 1;
    repair.Process = 7;
    repair.RaiseStaff = staff;
    getRepository(Staff).push(staff);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    const result = service.feedback(repair.Id, staff.Id, 3, 'test');
    expect(result).toBe(true);
    expect(repair.Score).toBe(3);
    expect(repair.Close).toBe(true);
    expect(getRepository(Repair)).toContain(repair);
  });
});
