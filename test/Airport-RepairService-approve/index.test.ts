import {ApprovalHistory, getRepository, Repair, RepairService, Staff} from './entry';
describe('Airport/RepairService/approve', () => {
  it('Happy Path', () => {
    const staff = new Staff();
    staff.Id = 1;
    const repair = new Repair();
    repair.Id = 1;
    repair.History = [];
    getRepository(Staff).push(staff);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    const result = service.approve(1, 1, true, 'test');
    expect(getRepository(ApprovalHistory)).toContain(result);
    expect(repair.History).toContain(result);
    expect(result.Reject).toBe(true);
    expect(result.Suggestion).toBe('test');
  });
});
