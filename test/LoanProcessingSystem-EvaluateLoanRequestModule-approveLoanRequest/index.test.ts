import {EvaluateLoanRequestModule, LoanRequest, LoanRequestStatus} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/approveLoanRequest', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    service.CurrentLoanRequest = loanRequest;
    const result = service.approveLoanRequest();
    expect(result).toBe(true);
    expect(loanRequest.Status).toBe(LoanRequestStatus.APPROVED);
  });
});
