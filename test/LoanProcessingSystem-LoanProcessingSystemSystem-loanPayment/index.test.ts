import {getRepository, Loan, LoanProcessingSystemSystem, LoanStatus} from './entry';
describe('LoanProcessingSystem/LoanProcessingSystemSystem/loanPayment', () => {
  it('Happy Path', () => {
    const service = new LoanProcessingSystemSystem();
    const loan = new Loan();
    loan.LoanID = 1;
    loan.Status = LoanStatus.LSOPEN;
    loan.RemainAmountToPay = 10;
    loan.RepaymentAmount = 1;
    getRepository(Loan).push(loan);
    const result = service.loanPayment(loan.LoanID);
    expect(result).toBe(true);
    expect(loan.RemainAmountToPay).toBe(9);
  });
});
