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
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

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

  it('returns the recommendation collection of the identified user', () => {
    const service = new LibraryManagementSystemSystem();
    const a = new RecommendBook();
    const b = new RecommendBook();
    const target = new User();
    target.UserID = '1';
    target.RecommendedBook = [a, b];
    const other = new User();
    other.UserID = '2';
    other.RecommendedBook = [new RecommendBook()];
    getRepository(User).push(other, target);

    expectSameMembers(service.listRecommendBook('1'), [a, b]);
  });

  it('rejects when recommended book list is undefined', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    getRepository(User).push(user);
    expectPreconditionRejected(() => service.listRecommendBook(user.UserID));
  });

  it('rejects when user does not exist', () => {
    const service = new LibraryManagementSystemSystem();
    expectPreconditionRejected(() => service.listRecommendBook('99'));
  });
});
