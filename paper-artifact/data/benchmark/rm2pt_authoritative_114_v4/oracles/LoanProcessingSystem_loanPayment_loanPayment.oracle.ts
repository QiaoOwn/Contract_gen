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

describe('LoanProcessingSystem/LoanProcessingSystemSystem/loanPayment', () => {
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
    loan.RemainAmountToPay = 10;
    loan.RepaymentAmount = 1;
    getRepository(Loan).push(loan);
    const result = service.loanPayment(loan.LoanID);
    expect(result).toBe(true);
    expect(loan.RemainAmountToPay).toBe(9);
  });

  it.each([
    [31, 4],
    [120.5, 13.25],
    [0, 0],
  ])(
    'subtracts the loan RepaymentAmount from RemainAmountToPay (%s - %s) without changing a neighbor',
    (before, repayment) => {
      const service = new LoanProcessingSystemSystem();
      const loan = new Loan();
      loan.LoanID = 51;
      loan.Status = LoanStatus.LSOPEN;
      loan.RemainAmountToPay = before;
      loan.RepaymentAmount = repayment;
      const neighbor = new Loan();
      neighbor.LoanID = 52;
      neighbor.Status = LoanStatus.LSOPEN;
      neighbor.RemainAmountToPay = 88;
      neighbor.RepaymentAmount = 7;
      getRepository(Loan).push(neighbor, loan);
      expect(service.loanPayment(loan.LoanID)).toBe(true);
      expect(loan.RemainAmountToPay).toBe(before - repayment);
      expect(neighbor.RemainAmountToPay).toBe(88);
      expect(neighbor.RepaymentAmount).toBe(7);
      expect(neighbor.Status).toBe(LoanStatus.LSOPEN);
      expect(getRepository(Loan)).toEqual([neighbor, loan]);
    }
  );

  it('rejects a found Loan whose status is not LSOPEN', () => {
    const service = new LoanProcessingSystemSystem();
    const loan = new Loan();
    loan.LoanID = 52;
    loan.Status = LoanStatus.CLOSED;
    loan.RemainAmountToPay = 31;
    loan.RepaymentAmount = 4;
    const neighbor = new Loan();
    neighbor.LoanID = 53;
    neighbor.Status = LoanStatus.LSOPEN;
    neighbor.RemainAmountToPay = 88;
    neighbor.RepaymentAmount = 7;
    getRepository(Loan).push(neighbor, loan);
    expectPreconditionRejected(() => service.loanPayment(loan.LoanID));
    expect(loan.RemainAmountToPay).toBe(31);
    expect(neighbor.RemainAmountToPay).toBe(88);
    expect(getRepository(Loan)).toEqual([neighbor, loan]);
  });

  it('rejects when precondition is violated', () => {
    const service = new LoanProcessingSystemSystem();
    const neighbor = new Loan();
    neighbor.LoanID = 54;
    neighbor.Status = LoanStatus.LSOPEN;
    neighbor.RemainAmountToPay = 88;
    neighbor.RepaymentAmount = 7;
    getRepository(Loan).push(neighbor);
    expectPreconditionRejected(() => service.loanPayment(99));
    expect(neighbor.RemainAmountToPay).toBe(88);
    expect(getRepository(Loan)).toEqual([neighbor]);
  });
});
