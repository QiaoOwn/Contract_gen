import {
  GenerateLoanLetterAndAgreementModule,
  getRepository,
  LoanAgreement,
  LoanRequest,
} from './entry';
describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/generateLoanAgreement', () => {
  it('Happy Path', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    service.CurrentLoanRequest = loanRequest;
    const result = service.generateLoanAgreement();
    expect(result).toBe(true);
    const loanAgreement = getRepository(LoanAgreement)[0];
    expect(loanAgreement.Content).toBe('Loan Agreement');
    expect(loanRequest.AttachedLoanAgreement).toBe(loanAgreement);
  });
});
