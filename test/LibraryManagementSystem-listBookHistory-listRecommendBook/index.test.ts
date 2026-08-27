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

describe('LibraryManagementSystem/ListBookHistory/listRecommendBook', () => {
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
    const recommendBook = new RecommendBook();
    user.RecommendedBook = [recommendBook];
    getRepository(User).push(user);
    const result = service.listRecommendBook(user.UserID);
    expect(result).toContain(recommendBook);
  });

  it('rejects when recommended book list is undefined', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    getRepository(User).push(user);
    expectPreconditionRejected(() => service.listRecommendBook(user.UserID));
  });
});
