import {getRepository, Loan, LoanProcessingSystemSystem, LoanStatus} from './entry';
describe('LoanProcessingSystem/LoanProcessingSystemSystem/closeOutLoan', () => {
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
});
