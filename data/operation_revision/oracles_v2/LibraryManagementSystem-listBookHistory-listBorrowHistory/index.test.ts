import {expectSameMembers} from '../helpers/setOracle';
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

  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    user.LoanedBook = [new Loan()];
    getRepository(User).push(user);
    const result = service.listBorrowHistory(user.UserID);
    expectSameMembers(result, user.LoanedBook);
  });

  it('rejects when precondition is violated', () => {
    const service = new ListBookHistory();
    expectPreconditionRejected(() => service.listBorrowHistory('99'));
  });
});
