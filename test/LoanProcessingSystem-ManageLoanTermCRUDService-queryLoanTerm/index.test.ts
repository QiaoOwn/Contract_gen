import {getRepository, LoanTerm, ManageLoanTermCRUDService} from './entry';
describe('LoanProcessingSystem/ManageLoanTermCRUDService/queryLoanTerm', () => {
  it('Happy Path', () => {
    const service = new ManageLoanTermCRUDService();
    const term = new LoanTerm();
    term.ItemID = 1;
    getRepository(LoanTerm).push(term);
    const result = service.queryLoanTerm(term.ItemID);
    expect(result).toBe(term);
  });
});
