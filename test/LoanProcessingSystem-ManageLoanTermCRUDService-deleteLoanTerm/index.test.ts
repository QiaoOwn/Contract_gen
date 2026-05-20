import {getRepository, LoanTerm, ManageLoanTermCRUDService} from './entry';
describe('LoanProcessingSystem/ManageLoanTermCRUDService/deleteLoanTerm', () => {
  it('Happy Path', () => {
    const service = new ManageLoanTermCRUDService();
    const term = new LoanTerm();
    term.ItemID = 1;
    term.Content = '1';
    getRepository(LoanTerm).push(term);
    const result = service.deleteLoanTerm(term.ItemID);
    expect(result).toBe(true);
    expect(getRepository(LoanTerm).length).toBe(0);
  });
});
