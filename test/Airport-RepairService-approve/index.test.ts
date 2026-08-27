import {ApprovalHistory, getRepository, Repair, RepairService, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/RepairService/approve', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Staff), getRepository(Repair), getRepository(ApprovalHistory));
  });

  const seed = (process: number, role: number) => {
    const staff = new Staff();
    staff.Id = 1;
    staff.Role = role;
    const repair = new Repair();
    repair.Id = 1;
    repair.Process = process;
    repair.History = [];
    getRepository(Staff).push(staff);
    getRepository(Repair).push(repair);
    return {staff, repair, service: new RepairService()};
  };

  it('Happy Path: records approval history and advances process for role 1', () => {
    const {repair, service} = seed(0, 1);
    const result = service.approve(1, 1, true, 'ok');
    expect(getRepository(ApprovalHistory)).toContain(result);
    expect(repair.History).toContain(result);
    expect(result.Reject).toBe(true);
    expect(result.Suggestion).toBe('ok');
    expect(repair.Process).toBe(1);
  });

  it.each([
    {initialProcess: 1, role: 2, expectedProcess: 2, label: 'manager approval'},
    {initialProcess: 2, role: 3, expectedProcess: 3, label: 'worker approval'},
  ])('advances the repair for $label', ({initialProcess, role, expectedProcess}) => {
    const {repair, service} = seed(initialProcess, role);
    const result = service.approve(1, 1, true, 'ok');
    expect(result.Reject).toBe(true);
    expect(repair.Process).toBe(expectedProcess);
  });

  it('moves repair to rejected stage when reject is false', () => {
    const {repair, service} = seed(0, 1);
    const result = service.approve(1, 1, false, 'no');
    expect(result.Reject).toBe(false);
    expect(repair.Process).toBe(5);
  });

  it('rejects when repair does not exist', () => {
    const staff = new Staff();
    staff.Id = 1;
    getRepository(Staff).push(staff);
    const service = new RepairService();
    expectPreconditionRejected(() => service.approve(1, 99, true, 'ok'));
    expect(getRepository(ApprovalHistory)).toHaveLength(0);
  });

  it('rejects when staff does not exist', () => {
    const repair = new Repair();
    repair.Id = 1;
    repair.History = [];
    getRepository(Repair).push(repair);
    const service = new RepairService();
    expectPreconditionRejected(() => service.approve(99, 1, true, 'ok'));
    expect(getRepository(ApprovalHistory)).toHaveLength(0);
    expect(repair.History).toHaveLength(0);
  });
});
