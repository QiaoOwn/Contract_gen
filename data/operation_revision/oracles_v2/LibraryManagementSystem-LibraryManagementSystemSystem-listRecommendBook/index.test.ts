import {expectSameMembers} from '../helpers/setOracle';
import {
  Administrator,
  Book,
  BookCopy,
  Faculty,
  Librarian,
  LibraryManagementSystemSystem,
  Loan,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/listRecommendBook', () => {
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
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    getRepository(User).push(user);
    const a = new RecommendBook();
    user.RecommendedBook = [a];
    const result = service.listRecommendBook(user.UserID);
    expectSameMembers(result, user.RecommendedBook);
  });

  it('rejects when recommended book list is undefined', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    getRepository(User).push(user);
    expectPreconditionRejected(() => service.listRecommendBook(user.UserID));
  });
});
