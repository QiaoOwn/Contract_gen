import {Device, getRepository, Repair, RepairService, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

/**
 * TOSEM adjudication (INT-FID-026): formal post is Process=7 and result=true only.
 * Parameter res and Repair.Result exist in signature/model/intent, but the formal
 * postcondition does not assign Result. Do not invent Repair.Result = res.
 * Intent "record its result" is documented incompleteness; corrected input delta softens it.
 */
describe('Airport/RepairService/finishRepair', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Staff), getRepository(Device), getRepository(Repair));
  });

  it('Happy Path: sets repair process to finished and returns true', () => {
    const staff = new Staff();
    staff.Id = 1;
    staff.Role = 3;
    const device = new Device();
    device.Id = 1;
    device.Contacts = staff;
    const repair = new Repair();
    repair.Id = 1;
    repair.RelatedDevice = device;
    repair.Process = 3;
    getRepository(Staff).push(staff);
    getRepository(Device).push(device);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    const result = service.finishRepair(repair.Id, staff.Id, device.Id, 'fixed');
    expect(result).toBe(true);
    expect(repair.Process).toBe(7);
    // res and Repair.Result are formally unconstrained, so no Result assertion is permitted.
  });

  it('rejects when device is not assigned to the staff', () => {
    const worker = new Staff();
    worker.Id = 1;
    worker.Role = 3;
    const other = new Staff();
    other.Id = 2;
    other.Role = 3;
    const device = new Device();
    device.Id = 1;
    device.Contacts = other;
    const repair = new Repair();
    repair.Id = 1;
    repair.Process = 3;
    getRepository(Staff).push(worker, other);
    getRepository(Device).push(device);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    expectPreconditionRejected(() =>
      service.finishRepair(repair.Id, worker.Id, device.Id, 'fixed')
    );
    expect(repair.Process).toBe(3);
  });

  it('rejects when staff is not a worker', () => {
    const staff = new Staff();
    staff.Id = 1;
    staff.Role = 1;
    const device = new Device();
    device.Id = 1;
    device.Contacts = staff;
    const repair = new Repair();
    repair.Id = 1;
    repair.Process = 3;
    getRepository(Staff).push(staff);
    getRepository(Device).push(device);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    expectPreconditionRejected(() => service.finishRepair(repair.Id, staff.Id, device.Id, 'fixed'));
    expect(repair.Process).toBe(3);
  });
});
