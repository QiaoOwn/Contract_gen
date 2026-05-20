import {
  GenerateLoanLetterAndAgreementModule,
  getRepository,
  LoanRequest,
  LoanRequestStatus,
} from './entry';
describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/listApprovalRequest', () => {
  it('Happy Path', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.APPROVED;
    getRepository(LoanRequest).push(loanRequest);
    const result = service.listApprovalRequest();
    expect(result).toContain(loanRequest);
    expect(service.CurrentLoanRequests).toContain(loanRequest);
  });
});
