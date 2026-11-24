import {Loan, LoanStatus, LoanProcessingSystemSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned closeOutLoan: required state transition', () => {
  beforeEach(() => {
    getRepository(Loan).splice(0);
  });
  const seed = (id = 7204) => {
    const target = Object.assign(new Loan(), {LoanID: id, Status: LoanStatus.LSOPEN, RemainAmountToPay: 237.75});
    const other = Object.assign(new Loan(), {LoanID: 7305, Status: LoanStatus.LSOPEN});
    getRepository(Loan).push(other, target);
    const service = new LoanProcessingSystemSystem();
    return {target, service};
  };
  const run = (id: number) => {
    const {target, service} = seed(id);
    expect(service.closeOutLoan(id)).toBe(true);
    expect(target.Status).toBe(LoanStatus.CLOSED);
  };
  it('performs the required transition on the selected object', () => run(7204));
  it('accepts an existing negative identifier', () => run(-7205));
  it('accepts an existing zero identifier', () => run(0));
  it('rejects a missing target among other records', () => {
    const {service} = seed();
    expectPreconditionRejected(() => service.closeOutLoan(9999));
  });
  it('rejects the wrong entry state', () => {
    const {target, service} = seed();
    target.Status = LoanStatus.CLOSED;
    expectPreconditionRejected(() => service.closeOutLoan(7204));
  });
  it('rejects an empty target repository', () => {
    const {service} = seed();
    getRepository(Loan).splice(0);
    expectPreconditionRejected(() => service.closeOutLoan(7204));
  });
});

