import {EnterValidatedCreditReferencesModule, LoanRequest, LoanRequestStatus} from './entry';
describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/markRequestValid', () => {
  it('Happy Path', () => {
    const service = new EnterValidatedCreditReferencesModule();
    service.CurrentLoanRequest = new LoanRequest();
    const result = service.markRequestValid();
    expect(result).toBe(true);
    expect(service.CurrentLoanRequest.Status).toBe(LoanRequestStatus.REFERENCESVALIDATED);
  });
});
