import {ApprovalHistory, getRepository, Repair, RepairService, Staff} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/RepairService/approve', () => {
  beforeEach(() => clearRepositories(getRepository(Staff), getRepository(Repair), getRepository(ApprovalHistory)));

  const seed = (process: number, role: number) => {
    const staff = Object.assign(new Staff(), {Id: 1, Role: role});
    const repair = Object.assign(new Repair(), {Id: 1, Process: process, History: [] as ApprovalHistory[]});
    getRepository(Staff).push(staff);
    getRepository(Repair).push(repair);
    return {repair, service: new RepairService()};
  };

  it.each([
    {from: 0, role: 1, to: 1},
    {from: 1, role: 2, to: 2},
    {from: 2, role: 3, to: 3},
  ])('creates a linked history and advances stage $from to $to', ({from, role, to}) => {
    const {repair, service} = seed(from, role);
    const result = service.approve(1, 1, true, 'approved');
    expect(result).toBeInstanceOf(ApprovalHistory);
    expect(getRepository(ApprovalHistory)).toEqual([result]);
    expect(repair.History).toEqual([result]);
    expect(result.Reject).toBe(true);
    expect(result.Suggestion).toBe('approved');
    expect(repair.Process).toBe(to);
  });

  it('creates a linked history and sets the rejected stage', () => {
    const {repair, service} = seed(0, 1);
    const result = service.approve(1, 1, false, 'revise');
    expect(result).toBeInstanceOf(ApprovalHistory);
    expect(getRepository(ApprovalHistory)).toEqual([result]);
    expect(repair.History).toEqual([result]);
    expect(result.Reject).toBe(false);
    expect(result.Suggestion).toBe('revise');
    expect(repair.Process).toBe(5);
  });

  it('rejects an unknown Repair without creating history', () => {
    getRepository(Staff).push(Object.assign(new Staff(), {Id: 1}));
    expectPreconditionRejected(() => new RepairService().approve(1, 99, true, 'ok'));
    expect(getRepository(ApprovalHistory)).toHaveLength(0);
  });

  it('rejects an unknown Staff without changing the Repair', () => {
    const repair = Object.assign(new Repair(), {Id: 1, Process: 0, History: [] as ApprovalHistory[]});
    getRepository(Repair).push(repair);
    expectPreconditionRejected(() => new RepairService().approve(99, 1, true, 'ok'));
    expect(getRepository(ApprovalHistory)).toHaveLength(0);
    expect(repair.History).toHaveLength(0);
    expect(repair.Process).toBe(0);
  });
});
