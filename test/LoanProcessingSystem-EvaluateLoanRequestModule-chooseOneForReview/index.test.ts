import {EvaluateLoanRequestModule, LoanRequest, LoanRequestStatus} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/chooseOneForReview', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    loanRequest.Status = LoanRequestStatus.REFERENCESVALIDATED;
    service.CurrentLoanRequests = [loanRequest];
    const result = service.chooseOneForReview(loanRequest.RequestID);
    expect(result).toBe(loanRequest);
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });
});
