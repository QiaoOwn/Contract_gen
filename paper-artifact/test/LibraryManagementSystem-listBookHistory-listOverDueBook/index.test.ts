import {
  Administrator,
  Book,
  BookCopy,
  Faculty,
  Librarian,
  ListBookHistory,
  Loan,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ListBookHistory/listOverDueBook', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(Administrator),
      getRepository(Book),
      getRepository(BookCopy),
      getRepository(Faculty),
      getRepository(Librarian),
      getRepository(Loan),
      getRepository(RecommendBook),
      getRepository(Reserve),
      getRepository(Student),
      getRepository(Subject),
      getRepository(User)
    );
  });

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

  it('rejects an unknown user without producing a result', () => {
    const service = new ListBookHistory();

    expectPreconditionRejected(() => service.listOverDueBook('missing-user'));
    expect(getRepository(Loan)).toHaveLength(0);
  });
});
