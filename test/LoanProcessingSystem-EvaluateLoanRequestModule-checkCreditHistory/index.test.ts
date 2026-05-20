import {CreditHistory, EvaluateLoanRequestModule, LoanRequest} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/checkCreditHistory', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    const creditHistory = new CreditHistory();
    loanRequest.RequestedCreditHistory = creditHistory;
    service.CurrentLoanRequest = loanRequest;
    const result = service.checkCreditHistory();
    expect(result).toBe(creditHistory);
  });
});
