import {CheckingAccount, EvaluateLoanRequestModule, LoanRequest} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/reviewCheckingAccount', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    const checkingAccount = new CheckingAccount();
    loanRequest.RequestedCAHistory = checkingAccount;
    service.CurrentLoanRequest = loanRequest;
    const result = service.reviewCheckingAccount();
    expect(result).toBe(checkingAccount);
  });
});
