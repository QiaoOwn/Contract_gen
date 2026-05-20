import {EvaluateLoanRequestModule, getRepository, LoanRequest, LoanTerm} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/addLoanTerm', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const term = new LoanTerm();
    term.ItemID = 1;
    getRepository(LoanTerm).push(term);
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.AttachedLoanTerms = [];
    const result = service.addLoanTerm(term.ItemID);
    expect(result).toBe(true);
    expect(service.CurrentLoanRequest.AttachedLoanTerms).toContain(term);
  });
});
