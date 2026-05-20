import {getRepository, LoanTerm, ManageLoanTermCRUDService} from './entry';
describe('LoanProcessingSystem/ManageLoanTermCRUDService/createLoanTerm', () => {
  it('Happy Path', () => {
    const service = new ManageLoanTermCRUDService();
    const result = service.createLoanTerm(1, '2');
    expect(result).toBe(true);
    const term = getRepository(LoanTerm)[0];
    expect(term.ItemID).toBe(1);
    expect(term.Content).toBe('2');
  });
});
