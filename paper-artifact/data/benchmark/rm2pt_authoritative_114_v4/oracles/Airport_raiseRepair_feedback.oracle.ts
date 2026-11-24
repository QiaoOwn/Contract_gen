import {getRepository, Repair, RepairService, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/RepairService/feedback', () => {
  beforeEach(() => clearRepositories(getRepository(Staff), getRepository(Repair)));

  const seed = (process = 7, role = 0) => {
    const staff = Object.assign(new Staff(), {Id: 1, Role: role});
    const repair = Object.assign(new Repair(), {Id: 1, Process: process, RaiseStaff: staff, Close: false});
    getRepository(Staff).push(staff);
    getRepository(Repair).push(repair);
    return {staff, repair, service: new RepairService()};
  };

  it.each([3, 4])('records score %i and closes a completed Repair', score => {
    const {staff, repair, service} = seed();
    expect(service.feedback(repair.Id, staff.Id, score, 'good')).toBe(true);
    expect(repair.Score).toBe(score);
    expect(repair.Close).toBe(true);
    expect(getRepository(Repair)).toContain(repair);
  });

  it('records a low score, description, and initial stage without closing', () => {
    const {staff, repair, service} = seed();
    expect(service.feedback(repair.Id, staff.Id, 2, 'needs work')).toBe(true);
    expect(repair.Score).toBe(2);
    expect(repair.Close).toBe(false);
    expect(repair.Description).toBe('needs work');
    expect(repair.Process).toBe(0);
  });

  it('rejects a Staff member who did not raise the Repair', () => {
    const {repair, service} = seed();
    const other = Object.assign(new Staff(), {Id: 2, Role: 0});
    getRepository(Staff).push(other);
    expectPreconditionRejected(() => service.feedback(repair.Id, other.Id, 3, 'good'));
    expect(repair.Score).toBeUndefined();
    expect(repair.Close).toBe(false);
    expect(repair.Process).toBe(7);
  });

  it('rejects a Repair that is not finished', () => {
    const {staff, repair, service} = seed(3);
    expectPreconditionRejected(() => service.feedback(repair.Id, staff.Id, 3, 'good'));
    expect(repair.Score).toBeUndefined();
    expect(repair.Close).toBe(false);
    expect(repair.Process).toBe(3);
  });

  it('rejects a Staff member without the GroundStaff role', () => {
    const {staff, repair, service} = seed(7, 3);
    expectPreconditionRejected(() => service.feedback(repair.Id, staff.Id, 3, 'good'));
    expect(repair.Score).toBeUndefined();
    expect(repair.Close).toBe(false);
    expect(repair.Process).toBe(7);
  });
});
