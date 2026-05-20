import {EnterValidatedCreditReferencesModule, LoanRequest} from './entry';
describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/chooseLoanRequest', () => {
  it('Happy Path', () => {
    const service = new EnterValidatedCreditReferencesModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    service.CurrentLoanRequests = [loanRequest];
    const result = service.chooseLoanRequest(loanRequest.RequestID);
    expect(result).toBe(loanRequest);
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });
});
