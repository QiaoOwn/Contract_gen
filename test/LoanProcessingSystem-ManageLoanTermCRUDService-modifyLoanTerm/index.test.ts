import {getRepository, LoanTerm, ManageLoanTermCRUDService} from './entry';
describe('LoanProcessingSystem/ManageLoanTermCRUDService/modifyLoanTerm', () => {
  it('Happy Path', () => {
    const service = new ManageLoanTermCRUDService();
    const term = new LoanTerm();
    term.ItemID = 1;
    term.Content = '1';
    getRepository(LoanTerm).push(term);
    const result = service.modifyLoanTerm(term.ItemID, 'modifiedContent');
    expect(result).toBe(true);
    expect(term.Content).toBe('modifiedContent');
  });
});
