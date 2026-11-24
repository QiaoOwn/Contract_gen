import dayjs from 'dayjs';
import {User, Student, Faculty, BookCopy, Loan, CopyStatus, BorrowStatus, Programme,
  LibraryManagementSystemSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/renewBook', () => {
  beforeEach(() => {
    getRepository(User).splice(0);
    getRepository(Student).splice(0);
    getRepository(Faculty).splice(0);
    getRepository(BookCopy).splice(0);
    getRepository(Loan).splice(0);
  });

  function setup(kind = 'bachelor', issue = '') {
    const student = !['faculty', 'plain'].includes(kind);
    const user = student ? new Student() : kind === 'faculty' ? new Faculty() : new User();
    user.UserID = 'acceptance-renew';
    user.BorrowStatus = issue === 'suspended' ? BorrowStatus.SUSPEND : BorrowStatus.NORMAL;
    if (user instanceof Student)
      user.Programme = kind === 'master' ? Programme.MASTER : kind === 'phd' ? Programme.PHD : Programme.BACHELOR;
    if (issue !== 'no-user') {
      getRepository(User).push(user);
      if (user instanceof Student) getRepository(Student).push(user);
      if (user instanceof Faculty) getRepository(Faculty).push(user);
    }
    const copy = Object.assign(new BookCopy(), {Barcode: 'copy-29',
      Status: issue === 'available' ? CopyStatus.AVAILABLE : CopyStatus.LOANED,
      IsReserved: issue === 'reserved'});
    if (issue !== 'no-copy') getRepository(BookCopy).push(copy);
    const due = dayjs().startOf('day').add(issue === 'today' ? 0 : issue === 'past' ? -2 : 13, 'day');
    const count = issue === 'limit' ? (student ? 3 : 6) : (student ? 2 : 5);
    const loan = Object.assign(new Loan(), {LoanedUser: user, LoanedCopy: copy, DueDate: due,
      RenewedTimes: count, IsReturned: kind === 'returned', OverDueFee: issue === 'fee' ? 2.75 : 0});
    getRepository(Loan).push(
      Object.assign(new Loan(), {...loan, LoanedUser: new User()}),
      Object.assign(new Loan(), {...loan, LoanedCopy: new BookCopy()})
    );
    if (issue !== 'no-loan') getRepository(Loan).push(loan);
    return {loan, due, count,
      call: () => new LibraryManagementSystemSystem().renewBook(user.UserID, copy.Barcode)};
  }

  it.each([
    ['bachelor', 20], ['master', 40], ['phd', 60],
    ['faculty', 60], ['plain', 60], ['returned', 20],
  ] as const)('renews %s by %i days from the previous due date', (kind, days) => {
    const {loan, due, count, call} = setup(kind);
    const today = dayjs();
    expect(call()).toBe(true);
    expect(loan.RenewedTimes).toBe(count + 1);
    expect(loan.RenewDate.isSame(today, 'day')).toBe(true);
    expect(loan.DueDate.isSame(due.add(days, 'day'), 'day')).toBe(true);
  });

  it.each(['no-user', 'suspended', 'no-copy', 'available', 'no-loan',
    'reserved', 'today', 'past', 'fee'])('rejects %s without changing the Loan', issue => {
    const {loan, due, count, call} = setup('bachelor', issue);
    const oldRenewDate = loan.RenewDate;
    expectPreconditionRejected(call);
    expect(loan.RenewedTimes).toBe(count);
    expect(loan.DueDate.isSame(due)).toBe(true);
    expect(loan.RenewDate).toBe(oldRenewDate);
  });

  it.each(['bachelor', 'faculty'])('rejects %s at the renewal limit without changing the Loan', kind => {
    const {loan, due, count, call} = setup(kind, 'limit');
    const oldRenewDate = loan.RenewDate;
    expectPreconditionRejected(call);
    expect(loan.RenewedTimes).toBe(count);
    expect(loan.DueDate.isSame(due)).toBe(true);
    expect(loan.RenewDate).toBe(oldRenewDate);
  });
});
