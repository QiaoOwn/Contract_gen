import {BookCopy, getRepository, ListBookHistory, Loan, User} from './entry';
describe('LibraryManagementSystem/ListBookHistory/listOverDueBook', () => {
  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    const loan = new Loan();
    const loan1 = new Loan();
    loan.LoanedCopy = new BookCopy();
    loan.IsReturned = false;
    loan.OverDueFee = 1;
    loan1.IsReturned = true;
    user.LoanedBook = [loan, loan1];
    getRepository(User).push(user);
    const result = service.listOverDueBook(user.UserID);
    expect(result).toContain(loan.LoanedCopy);
  });
});
