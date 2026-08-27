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

describe('LibraryManagementSystem/ListBookHistory/listReservationBook', () => {
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
    const reserve = new Reserve();
    reserve.ReservedCopy = new BookCopy();
    user.ReservedBook = [reserve];
    getRepository(User).push(user);
    const result = service.listReservationBook(user.UserID);
    expect(result).toContain(reserve.ReservedCopy);
  });

  it('rejects when reserved book list is undefined', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    getRepository(User).push(user);
    expectPreconditionRejected(() => service.listReservationBook(user.UserID));
  });
});
