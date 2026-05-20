import {
  GenerateLoanLetterAndAgreementModule,
  getRepository,
  LoanAccount,
  LoanAccountStatus,
} from './entry';
describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/createLoanAccount', () => {
  it('Happy Path', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const result = service.createLoanAccount(1, 2, LoanAccountStatus.NORMAL);
    expect(result).toBe(true);
    const loanAccount = getRepository(LoanAccount)[0];
    expect(loanAccount.LoanAccountID).toBe(1);
    expect(loanAccount.Balance).toBe(2);
    expect(loanAccount.Status).toBe(LoanAccountStatus.NORMAL);
  });
});
