import {EvaluateLoanRequestModule, getRepository, LoanRequest, LoanRequestStatus} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/listTenLoanRequest', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.REFERENCESVALIDATED;
    getRepository(LoanRequest).push(loanRequest);
    service.CurrentLoanRequests = [];
    const result = service.listTenLoanRequest();
    expect(result).toContain(loanRequest);
    expect(service.CurrentLoanRequests).toContain(loanRequest);
  });
});
