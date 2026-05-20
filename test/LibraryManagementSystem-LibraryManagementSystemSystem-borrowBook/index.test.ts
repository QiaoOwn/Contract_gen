import {
  BookCopy,
  BorrowStatus,
  CopyStatus,
  Faculty,
  getRepository,
  LibraryManagementSystemSystem,
  Programme,
  Reserve,
  Student,
  User,
  Loan,
} from './entry';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/borrowBook', () => {
  it('Happy Path', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    user.BorrowStatus = BorrowStatus.NORMAL;
    user.SuspensionDays = 0;
    user.LoanedNumber = 0;
    user.LoanedBook = [];
    const copy = new BookCopy();
    copy.Barcode = '1';
    copy.Status = CopyStatus.ONHOLDSHELF;
    copy.IsReserved = true;
    copy.LoanedRecord = [];
    const reserve = new Reserve();
    reserve.ReservedCopy = copy;
    reserve.IsReserveClosed = false;
    reserve.ReservedUser = user;
    reserve.IsReserveClosed = false;
    const student = new Student();
    student.UserID = user.UserID;
    student.Programme = Programme.BACHELOR;
    student.LoanedNumber = 1;
    const faculty = new Faculty();
    faculty.UserID = user.UserID;
    faculty.LoanedNumber = 11;

    getRepository(Reserve).push(reserve);
    getRepository(Faculty).push(faculty);
    getRepository(Student).push(student);
    getRepository(User).push(user);
    getRepository(BookCopy).push(copy);
    const result = service.borrowBook(user.UserID, copy.Barcode);
    expect(result).toBe(true);
    expect(copy.Status).toBe(CopyStatus.LOANED);
    expect(copy.IsReserved).toBe(false);
    expect(reserve.IsReserveClosed).toBe(true);
    expect(user.LoanedNumber).toBe(1);
    expect(user.LoanedBook).toHaveLength(1);
    expect(copy.LoanedRecord).toHaveLength(1);
    expect(getRepository(Loan)).toContain(user.LoanedBook[0]);
  });
});
