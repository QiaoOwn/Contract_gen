import {
  Administrator,
  Book,
  BookCopy,
  BorrowStatus,
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

describe('LibraryManagementSystem/LibraryManagementSystemSystem/cancelReservation', () => {
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
    user.BorrowStatus = BorrowStatus.NORMAL;
    user.SuspensionDays = 0;
    user.LoanedBook = [];
    const copy = new BookCopy();
    copy.Barcode = '1';
    copy.Status = CopyStatus.LOANED;
    copy.IsReserved = true;
    copy.LoanedRecord = [];
    const reserve = new Reserve();
    reserve.ReservedCopy = copy;
    reserve.IsReserveClosed = false;
    reserve.ReservedUser = user;
    reserve.IsReserveClosed = false;
    getRepository(Reserve).push(reserve);
    getRepository(User).push(user);
    getRepository(BookCopy).push(copy);
    const result = service.cancelReservation(user.UserID, copy.Barcode);
    expect(result).toBe(true);
    expect(copy.IsReserved).toBe(false);
    expect(reserve.IsReserveClosed).toBe(true);
  });

  it('rejects when user does not exist', () => {
    const service = new LibraryManagementSystemSystem();
    expectPreconditionRejected(() => service.cancelReservation('missing', 'missing'));
  });
});
