import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  GenerateLoanLetterAndAgreementModule,
  Loan,
  LoanAccount,
  LoanAccountStatus,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/createLoanAccount', () => {
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
    const service = new GenerateLoanLetterAndAgreementModule();
    const result = service.createLoanAccount(1, 2, LoanAccountStatus.NORMAL);
    expect(result).toBe(true);
    const loanAccount = getRepository(LoanAccount)[0];
    expect(loanAccount.LoanAccountID).toBe(1);
    expect(loanAccount.Balance).toBe(2);
    expect(loanAccount.Status).toBe(LoanAccountStatus.NORMAL);
  });

  it('rejects when identifier is already used', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const result = service.createLoanAccount(1, 2, LoanAccountStatus.NORMAL);
    expect(result).toBe(true);
    const loanAccount = getRepository(LoanAccount)[0];
    expect(loanAccount.LoanAccountID).toBe(1);
    expect(loanAccount.Balance).toBe(2);
    expect(loanAccount.Status).toBe(LoanAccountStatus.NORMAL);
    const again = new GenerateLoanLetterAndAgreementModule();
    expectPreconditionRejected(() => again.createLoanAccount(1, 2, LoanAccountStatus.NORMAL));
  });
});
