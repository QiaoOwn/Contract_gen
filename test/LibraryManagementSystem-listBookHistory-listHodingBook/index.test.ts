import {getRepository, ListBookHistory, Loan, User} from './entry';
describe('LibraryManagementSystem/ListBookHistory/listHodingBook', () => {
  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    const loan = new Loan();
    const loan1 = new Loan();
    loan.IsReturned = false;
    loan1.IsReturned = true;
    user.LoanedBook = [loan, loan1];
    getRepository(User).push(user);
    const result = service.listHodingBook(user.UserID);
    expect(result).toContain(loan);
    expect(result).not.toContain(loan1);
  });
});
