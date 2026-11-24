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
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ListBookHistory/listBorrowHistory', () => {
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

  it('returns the loaned-book collection of the identified user', () => {
    const service = new ListBookHistory();
    const loanA = new Loan();
    const loanB = new Loan();
    const target = new User();
    target.UserID = '1';
    target.LoanedBook = [loanA, loanB];
    const other = new User();
    other.UserID = '2';
    other.LoanedBook = [new Loan()];
    getRepository(User).push(other, target);

    expectSameMembers(service.listBorrowHistory('1'), [loanA, loanB]);
  });

  it('rejects when user does not exist', () => {
    const service = new ListBookHistory();
    expectPreconditionRejected(() => service.listBorrowHistory('99'));
  });
});
