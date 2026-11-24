import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanProcessingSystemSystem,
  LoanRequest,
  LoanStatus,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/LoanProcessingSystemSystem/closeOutLoan', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(ApprovalLetter),
      getRepository(CheckingAccount),
      getRepository(CreditHistory),
      getRepository(Loan),
      getRepository(LoanAccount),
      getRepository(LoanAgreement),
      getRepository(LoanRequest),
      getRepository(LoanTerm)
    );
  });

  it('Happy Path', () => {
    const service = new LoanProcessingSystemSystem();
    const loan = new Loan();
    loan.LoanID = 1;
    loan.Status = LoanStatus.LSOPEN;
    getRepository(Loan).push(loan);
    expect(service.closeOutLoan(loan.LoanID)).toBe(true);
    expect(loan.Status).toBe(LoanStatus.CLOSED);
  });

  it('closes only the selected LSOPEN Loan and leaves a neighbor unchanged', () => {
    const service = new LoanProcessingSystemSystem();
    const loan = new Loan();
    loan.LoanID = 51;
    loan.Status = LoanStatus.LSOPEN;
    const neighbor = new Loan();
    neighbor.LoanID = 52;
    neighbor.Status = LoanStatus.LSOPEN;
    getRepository(Loan).push(neighbor, loan);
    expect(service.closeOutLoan(loan.LoanID)).toBe(true);
    expect(loan.Status).toBe(LoanStatus.CLOSED);
    expect(neighbor.Status).toBe(LoanStatus.LSOPEN);
    expect(getRepository(Loan)).toEqual([neighbor, loan]);
  });

  it('rejects a found Loan whose status is not LSOPEN', () => {
    const service = new LoanProcessingSystemSystem();
    const loan = new Loan();
    loan.LoanID = 53;
    loan.Status = LoanStatus.CLOSED;
    const neighbor = new Loan();
    neighbor.LoanID = 54;
    neighbor.Status = LoanStatus.LSOPEN;
    getRepository(Loan).push(neighbor, loan);
    expectPreconditionRejected(() => service.closeOutLoan(loan.LoanID));
    expect(loan.Status).toBe(LoanStatus.CLOSED);
    expect(neighbor.Status).toBe(LoanStatus.LSOPEN);
    expect(getRepository(Loan)).toEqual([neighbor, loan]);
  });

  it('rejects when the Loan is missing', () => {
    const service = new LoanProcessingSystemSystem();
    const neighbor = new Loan();
    neighbor.LoanID = 55;
    neighbor.Status = LoanStatus.LSOPEN;
    getRepository(Loan).push(neighbor);
    expectPreconditionRejected(() => service.closeOutLoan(99));
    expect(neighbor.Status).toBe(LoanStatus.LSOPEN);
    expect(getRepository(Loan)).toEqual([neighbor]);
  });
});
