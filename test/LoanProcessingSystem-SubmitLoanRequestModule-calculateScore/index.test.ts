import {
  CheckingAccount,
  CreditHistory,
  LoanRequest,
  LoanRequestStatus,
  SubmitLoanRequestModule,
} from './entry';
describe('LoanProcessingSystem/SubmitLoanRequestModule/calculateScore', () => {
  it('Happy Path', () => {
    const service = new SubmitLoanRequestModule();
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.RequestedCAHistory = new CheckingAccount();
    service.CurrentLoanRequest.RequestedCreditHistory = new CreditHistory();
    const result = service.calculateScore();
    expect(result).toBe(100);
    expect(service.CurrentLoanRequest.CreditScore).toBe(100);
    expect(service.CurrentLoanRequest.Status).toBe(LoanRequestStatus.SUBMITTED);
  });
});
