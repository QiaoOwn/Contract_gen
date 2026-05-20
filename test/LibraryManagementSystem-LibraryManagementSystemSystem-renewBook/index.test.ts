import {
  BookCopy,
  BorrowStatus,
  CopyStatus,
  getRepository,
  LibraryManagementSystemSystem,
  Loan,
  User,
} from './entry';
import dayjs from 'dayjs';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/renewBook', () => {
  it('Happy Path', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    user.BorrowStatus = BorrowStatus.NORMAL;
    const copy = new BookCopy();
    copy.IsReserved = false;
    copy.Barcode = '1';
    copy.Status = CopyStatus.LOANED;
    const loan = new Loan();
    loan.DueDate = dayjs().add(1, 'd');
    loan.RenewedTimes = 1;
    loan.OverDueFee = 0;
    loan.LoanedUser = user;
    loan.LoanedCopy = copy;
    getRepository(User).push(user);
    getRepository(BookCopy).push(copy);
    getRepository(Loan).push(loan);
    const result = service.renewBook(user.UserID, copy.Barcode);
    expect(result).toBe(true);
    expect(loan.RenewedTimes).toBe(2);
    expect(loan.DueDate.isSame(dayjs().add(61, 'd'), 'd')).toBe(true);
  });
});
