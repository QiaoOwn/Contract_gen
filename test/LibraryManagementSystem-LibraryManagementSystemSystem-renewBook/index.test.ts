import dayjs from 'dayjs';
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
  Programme,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/renewBook', () => {
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

  const seedLoan = (
    kind: 'student' | 'faculty',
    programme: Programme = Programme.BACHELOR,
    borrowStatus: BorrowStatus = BorrowStatus.NORMAL,
    renewedTimes = 1
  ) => {
    const service = new LibraryManagementSystemSystem();
    const user = kind === 'student' ? new Student() : new Faculty();
    user.UserID = '1';
    user.BorrowStatus = borrowStatus;
    if (user instanceof Student) {
      user.Programme = programme;
    }

    const copy = new BookCopy();
    copy.IsReserved = false;
    copy.Barcode = '1';
    copy.Status = CopyStatus.LOANED;

    const loan = new Loan();
    const initialDueDate = dayjs().add(1, 'd');
    loan.DueDate = initialDueDate;
    loan.RenewedTimes = renewedTimes;
    loan.IsReturned = false;
    loan.OverDueFee = 0;
    loan.LoanedUser = user;
    loan.LoanedCopy = copy;

    getRepository(User).push(user);
    if (user instanceof Student) {
      getRepository(Student).push(user);
    } else {
      getRepository(Faculty).push(user);
    }
    getRepository(BookCopy).push(copy);
    getRepository(Loan).push(loan);
    return {service, user, copy, loan, initialDueDate};
  };

  it.each([
    {kind: 'student' as const, programme: Programme.BACHELOR, extension: 20},
    {kind: 'student' as const, programme: Programme.MASTER, extension: 40},
    {kind: 'student' as const, programme: Programme.PHD, extension: 60},
    {kind: 'faculty' as const, programme: Programme.BACHELOR, extension: 60},
  ])(
    'extends the due date by $extension days for $kind/$programme',
    ({kind, programme, extension}) => {
      const {service, user, copy, loan, initialDueDate} = seedLoan(kind, programme);
      const result = service.renewBook(user.UserID, copy.Barcode);
      expect(result).toBe(true);
      expect(loan.RenewedTimes).toBe(2);
      expect(loan.RenewDate.isSame(dayjs(), 'd')).toBe(true);
      expect(loan.DueDate.isSame(initialDueDate.add(extension, 'd'), 'd')).toBe(true);
    }
  );

  it('rejects a student at the three-renewal limit', () => {
    const {service, user, copy, loan, initialDueDate} = seedLoan(
      'student',
      Programme.BACHELOR,
      BorrowStatus.NORMAL,
      3
    );
    expectPreconditionRejected(() => service.renewBook(user.UserID, copy.Barcode));
    expect(loan.RenewedTimes).toBe(3);
    expect(loan.DueDate.isSame(initialDueDate, 'd')).toBe(true);
  });

  it('rejects a faculty user at the six-renewal limit', () => {
    const {service, user, copy, loan, initialDueDate} = seedLoan(
      'faculty',
      Programme.BACHELOR,
      BorrowStatus.NORMAL,
      6
    );
    expectPreconditionRejected(() => service.renewBook(user.UserID, copy.Barcode));
    expect(loan.RenewedTimes).toBe(6);
    expect(loan.DueDate.isSame(initialDueDate, 'd')).toBe(true);
  });

  it('rejects a reserved copy', () => {
    const {service, user, copy, loan} = seedLoan('student');
    copy.IsReserved = true;
    expectPreconditionRejected(() => service.renewBook(user.UserID, copy.Barcode));
    expect(loan.RenewedTimes).toBe(1);
  });

  it('rejects a loan whose due date is today', () => {
    const {service, user, copy, loan} = seedLoan('student');
    loan.DueDate = dayjs().startOf('day');
    expectPreconditionRejected(() => service.renewBook(user.UserID, copy.Barcode));
    expect(loan.RenewedTimes).toBe(1);
  });

  it('rejects a loan with an overdue fee', () => {
    const {service, user, copy, loan} = seedLoan('student');
    loan.OverDueFee = 1;
    expectPreconditionRejected(() => service.renewBook(user.UserID, copy.Barcode));
    expect(loan.RenewedTimes).toBe(1);
  });

  it('rejects when user borrow status is not NORMAL', () => {
    const {service, user, copy, loan} = seedLoan(
      'student',
      Programme.BACHELOR,
      BorrowStatus.SUSPEND
    );
    expectPreconditionRejected(() => service.renewBook(user.UserID, copy.Barcode));
    expect(loan.RenewedTimes).toBe(1);
  });
});
