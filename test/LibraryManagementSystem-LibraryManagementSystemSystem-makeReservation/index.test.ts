import dayjs from 'dayjs';
import {
  Administrator,
  Book,
  BookCopy,
  CopyStatus,
  Faculty,
  Librarian,
  LibraryManagementSystemSystem,
  Loan,
  RecommendBook,
  Reserve,
  Status,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/makeReservation', () => {
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
    user.ReservedBook = [];
    const bookCopy = new BookCopy();
    bookCopy.Barcode = '1';
    bookCopy.Status = CopyStatus.LOANED;
    bookCopy.IsReserved = false;
    bookCopy.ReservationRecord = [];
    getRepository(User).push(user);
    getRepository(BookCopy).push(bookCopy);
    const result = service.makeReservation(user.UserID, bookCopy.Barcode);
    expect(result).toBe(true);
    expect(user.ReservedBook.length).toBe(1);
    expect(bookCopy.ReservationRecord.length).toBe(1);
    expect(getRepository(Reserve).length).toBe(1);
    const reserve = getRepository(Reserve)[0];
    expect(bookCopy.IsReserved).toBe(true);
    expect(reserve.IsReserveClosed).toBe(false);
    expect(reserve.ReservedUser).toBe(user);
    expect(reserve.ReservedCopy).toBe(bookCopy);
    expect(reserve.ReserveDate.isSame(dayjs(), 'd')).toBe(true);
    expect(user.ReservedBook).toContain(reserve);
    expect(bookCopy.ReservationRecord).toContain(reserve);
  });

  it('rejects when user does not exist', () => {
    const service = new LibraryManagementSystemSystem();
    expectPreconditionRejected(() => service.makeReservation('missing', 'missing'));
  });
});
