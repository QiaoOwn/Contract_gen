import dayjs from 'dayjs';
import {
  BookCopy,
  BorrowStatus,
  CopyStatus,
  Faculty,
  getRepository,
  LibraryManagementSystemSystem,
  Loan,
  Programme,
  Reserve,
  Student,
  User,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/borrowBook', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(User),
      getRepository(Student),
      getRepository(Faculty),
      getRepository(BookCopy),
      getRepository(Reserve),
      getRepository(Loan)
    );
  });

  const seedBorrower = ({
    kind,
    programme = Programme.BACHELOR,
    loanedNumber = 0,
    borrowStatus = BorrowStatus.NORMAL,
    suspensionDays = 0,
    copyStatus = CopyStatus.AVAILABLE,
    reserved = false,
  }: {
    kind: 'student' | 'faculty';
    programme?: Programme;
    loanedNumber?: number;
    borrowStatus?: BorrowStatus;
    suspensionDays?: number;
    copyStatus?: CopyStatus;
    reserved?: boolean;
  }) => {
    const service = new LibraryManagementSystemSystem();
    const user = kind === 'student' ? new Student() : new Faculty();
    user.UserID = '1';
    user.BorrowStatus = borrowStatus;
    user.SuspensionDays = suspensionDays;
    user.LoanedNumber = loanedNumber;
    user.LoanedBook = [];
    if (user instanceof Student) {
      user.Programme = programme;
    }

    const copy = new BookCopy();
    copy.Barcode = '1';
    copy.Status = copyStatus;
    copy.IsReserved = reserved;
    copy.LoanedRecord = [];

    getRepository(User).push(user);
    if (user instanceof Student) {
      getRepository(Student).push(user);
    } else {
      getRepository(Faculty).push(user);
    }
    getRepository(BookCopy).push(copy);

    let reserve: Reserve | undefined;
    if (reserved) {
      reserve = new Reserve();
      reserve.ReservedCopy = copy;
      reserve.IsReserveClosed = false;
      reserve.ReservedUser = user;
      getRepository(Reserve).push(reserve);
    }

    return {service, user, copy, reserve};
  };

  it('loans a reserved copy to a student and records every post-state obligation', () => {
    const {service, user, copy, reserve} = seedBorrower({
      kind: 'student',
      copyStatus: CopyStatus.ONHOLDSHELF,
      reserved: true,
    });
    const result = service.borrowBook(user.UserID, copy.Barcode);
    const loan = getRepository(Loan)[0];

    expect(result).toBe(true);
    expect(loan).toBeDefined();
    expect(loan.LoanedUser).toBe(user);
    expect(loan.LoanedCopy).toBe(copy);
    expect(loan.IsReturned).toBe(false);
    expect(loan.LoanDate.isSame(dayjs(), 'd')).toBe(true);
    expect(loan.DueDate.isSame(dayjs().add(30, 'd'), 'd')).toBe(true);
    expect(loan.OverDue3Days).toBe(false);
    expect(loan.OverDue10Days).toBe(false);
    expect(loan.OverDue17Days).toBe(false);
    expect(loan.OverDue31Days).toBe(false);
    expect(copy.Status).toBe(CopyStatus.LOANED);
    expect(copy.IsReserved).toBe(false);
    expect(reserve?.IsReserveClosed).toBe(true);
    expect(user.LoanedNumber).toBe(1);
    expect(user.LoanedBook).toContain(loan);
    expect(copy.LoanedRecord).toContain(loan);
  });

  it('loans an available copy to faculty with a 60-day due date', () => {
    const {service, user, copy} = seedBorrower({kind: 'faculty'});
    expect(service.borrowBook(user.UserID, copy.Barcode)).toBe(true);
    const loan = getRepository(Loan)[0];
    expect(loan.LoanedUser).toBe(user);
    expect(loan.DueDate.isSame(dayjs().add(60, 'd'), 'd')).toBe(true);
    expect(copy.Status).toBe(CopyStatus.LOANED);
  });

  it('rejects when user does not exist', () => {
    const {service, copy} = seedBorrower({kind: 'student'});
    expectPreconditionRejected(() => service.borrowBook('missing', copy.Barcode));
    expect(copy.Status).toBe(CopyStatus.AVAILABLE);
    expect(getRepository(Loan)).toHaveLength(0);
  });

  it('rejects when copy does not exist', () => {
    const {service, user, copy} = seedBorrower({kind: 'student'});
    expectPreconditionRejected(() => service.borrowBook(user.UserID, 'missing'));
    expect(copy.Status).toBe(CopyStatus.AVAILABLE);
    expect(user.LoanedNumber).toBe(0);
  });

  it('rejects a suspended user without changing state', () => {
    const {service, user, copy} = seedBorrower({
      kind: 'student',
      borrowStatus: BorrowStatus.SUSPEND,
    });
    expectPreconditionRejected(() => service.borrowBook(user.UserID, copy.Barcode));
    expect(user.LoanedNumber).toBe(0);
    expect(copy.Status).toBe(CopyStatus.AVAILABLE);
    expect(getRepository(Loan)).toHaveLength(0);
  });

  it('rejects a faculty member at the loan quota', () => {
    const {service, user, copy} = seedBorrower({kind: 'faculty', loanedNumber: 60});
    expectPreconditionRejected(() => service.borrowBook(user.UserID, copy.Barcode));
    expect(user.LoanedNumber).toBe(60);
    expect(copy.Status).toBe(CopyStatus.AVAILABLE);
    expect(getRepository(Loan)).toHaveLength(0);
  });

  it.each([
    {programme: Programme.BACHELOR, limit: 20},
    {programme: Programme.MASTER, limit: 40},
    {programme: Programme.PHD, limit: 60},
  ])('rejects a $programme student at the $limit-loan quota', ({programme, limit}) => {
    const {service, user, copy} = seedBorrower({
      kind: 'student',
      programme,
      loanedNumber: limit,
    });
    expectPreconditionRejected(() => service.borrowBook(user.UserID, copy.Barcode));
    expect(user.LoanedNumber).toBe(limit);
    expect(copy.Status).toBe(CopyStatus.AVAILABLE);
    expect(getRepository(Loan)).toHaveLength(0);
  });

  it.each([
    {programme: Programme.BACHELOR, loanedNumber: 19},
    {programme: Programme.MASTER, loanedNumber: 39},
    {programme: Programme.PHD, loanedNumber: 59},
  ])(
    'accepts a $programme student immediately below the programme quota',
    ({programme, loanedNumber}) => {
      const {service, user, copy} = seedBorrower({
        kind: 'student',
        programme,
        loanedNumber,
      });
      expect(service.borrowBook(user.UserID, copy.Barcode)).toBe(true);
      expect(user.LoanedNumber).toBe(loanedNumber + 1);
      expect(copy.Status).toBe(CopyStatus.LOANED);
      expect(getRepository(Loan)).toHaveLength(1);
    }
  );
});
