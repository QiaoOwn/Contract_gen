import {getRepository, ListBookHistory, Loan, User} from './entry';
describe('LibraryManagementSystem/ListBookHistory/listBorrowHistory', () => {
  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    user.LoanedBook = [new Loan()];
    getRepository(User).push(user);
    const result = service.listBorrowHistory(user.UserID);
    expect(result).toBe(user.LoanedBook);
  });
});
