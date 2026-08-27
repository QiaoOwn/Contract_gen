import {Device, getRepository, Repair, RepairService, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/RepairService/feedback', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Staff), getRepository(Device), getRepository(Repair));
  });

  const seed = (scoreTargetProcess = 7) => {
    const staff = new Staff();
    staff.Id = 1;
    staff.Role = 0;
    const repair = new Repair();
    repair.Id = 1;
    repair.Process = scoreTargetProcess;
    repair.RaiseStaff = staff;
    repair.Close = false;
    getRepository(Staff).push(staff);
    getRepository(Repair).push(repair);
    return {staff, repair, service: new RepairService()};
  };

  it('Happy Path: high score closes the repair', () => {
    const {staff, repair, service} = seed();
    const result = service.feedback(repair.Id, staff.Id, 3, 'good');
    expect(result).toBe(true);
    expect(repair.Score).toBe(3);
    expect(repair.Close).toBe(true);
    expect(getRepository(Repair)).toContain(repair);
  });

  it('low score keeps repair open and resets process', () => {
    const {staff, repair, service} = seed();
    const result = service.feedback(repair.Id, staff.Id, 2, 'needs work');
    expect(result).toBe(true);
    expect(repair.Score).toBe(2);
    expect(repair.Close).toBe(false);
    expect(repair.Description).toBe('needs work');
    expect(repair.Process).toBe(0);
  });

  it('rejects when staff did not raise the repair', () => {
    const raiser = new Staff();
    raiser.Id = 1;
    raiser.Role = 0;
    const other = new Staff();
    other.Id = 2;
    other.Role = 0;
    const repair = new Repair();
    repair.Id = 1;
    repair.Process = 7;
    repair.RaiseStaff = raiser;
    getRepository(Staff).push(raiser, other);
    getRepository(Repair).push(repair);
    const service = new RepairService();
    expectPreconditionRejected(() => service.feedback(repair.Id, other.Id, 3, 'good'));
    expect(repair.Score).toBeUndefined();
    expect(repair.Process).toBe(7);
  });

  it('rejects when repair is not finished', () => {
    const {staff, repair, service} = seed(3);
    expectPreconditionRejected(() => service.feedback(repair.Id, staff.Id, 3, 'good'));
    expect(repair.Close).toBe(false);
  });
});
