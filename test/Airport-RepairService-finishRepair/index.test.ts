import {Device, getRepository, Repair, RepairService, Staff} from './entry';
describe('Airport/RepairService/finishRepair', () => {
  it('Happy Path', () => {
    const staff = new Staff();
    staff.Id = 1;
    staff.Role = 3;
    const device = new Device();
    device.Id = 1;
    device.Contacts = staff;
    const repair = new Repair();
    repair.Id = 1;
    repair.RelatedDevice = device;
    getRepository(Staff).push(staff);
    getRepository(Device).push(device);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    const result = service.finishRepair(repair.Id, staff.Id, device.Id, '');
    expect(result).toBe(true);
    expect(repair.Process).toBe(7);
  });
});
