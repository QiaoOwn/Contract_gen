import {
  ApprovalLetter,
  GenerateLoanLetterAndAgreementModule,
  getRepository,
  LoanRequest,
} from './entry';
describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/genereateApprovalLetter', () => {
  it('Happy Path', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    getRepository(LoanRequest).push(loanRequest);
    const result = service.genereateApprovalLetter(loanRequest.RequestID);
    expect(result).toBe(true);
    const approvalLetter = getRepository(ApprovalLetter)[0];
    expect(result).toBe(true);
    expect(approvalLetter.Content).toBe('ApprovalLetterContent');
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });
});
