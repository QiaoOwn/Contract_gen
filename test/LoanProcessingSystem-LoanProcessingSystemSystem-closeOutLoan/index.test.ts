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
  Status,
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
    const result = service.closeOutLoan(loan.LoanID);
    expect(result).toBe(true);
    expect(loan.Status).toBe(LoanStatus.CLOSED);
  });

  it('rejects when precondition is violated', () => {
    const service = new LoanProcessingSystemSystem();
    expectPreconditionRejected(() => service.closeOutLoan(99));
  });
});
