import {
  EnterValidatedCreditReferencesModule,
  getRepository,
  LoanRequest,
  LoanRequestStatus,
} from './entry';
describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/listSubmitedLoanRequest', () => {
  it('Happy Path', () => {
    const service = new EnterValidatedCreditReferencesModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.SUBMITTED;
    getRepository(LoanRequest).push(loanRequest);
    const result = service.listSubmitedLoanRequest();
    expect(result).toContain(loanRequest);
  });
});
