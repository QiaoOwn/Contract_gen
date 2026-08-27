import {
  Administrator,
  Book,
  BookCopy,
  BorrowStatus,
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
import {clearRepositories} from '../helpers/contractOracle';

// Vacuous precondition (true): rejection case not required by test/ORACLE.md.
describe('LibraryManagementSystem/LibraryManagementSystemSystem/countDownSuspensionDay', () => {
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
    const userA = new User();
    userA.SuspensionDays = 1;
    const userB = new User();
    userB.SuspensionDays = 1;
    userB.BorrowStatus = BorrowStatus.SUSPEND;
    userB.OverDueFee = 0;
    const userC = new User();
    userC.SuspensionDays = 3;
    getRepository(User).push(userA, userB, userC);
    service.countDownSuspensionDay();
    expect(userA.SuspensionDays).toBe(0);
    expect(userB.SuspensionDays).toBe(0);
    expect(userB.BorrowStatus).toBe(BorrowStatus.NORMAL);
    expect(userC.SuspensionDays).toBe(2);
  });

  it('does not change ineligible users or clear a suspension with an outstanding fee', () => {
    const service = new LibraryManagementSystemSystem();
    const zeroDayUser = new User();
    zeroDayUser.SuspensionDays = 0;
    zeroDayUser.BorrowStatus = BorrowStatus.SUSPEND;
    const owingUser = new User();
    owingUser.SuspensionDays = 1;
    owingUser.BorrowStatus = BorrowStatus.SUSPEND;
    owingUser.OverDueFee = 5;
    getRepository(User).push(zeroDayUser, owingUser);

    service.countDownSuspensionDay();

    expect(zeroDayUser.SuspensionDays).toBe(0);
    expect(zeroDayUser.BorrowStatus).toBe(BorrowStatus.SUSPEND);
    expect(owingUser.SuspensionDays).toBe(0);
    expect(owingUser.BorrowStatus).toBe(BorrowStatus.SUSPEND);
    expect(owingUser.OverDueFee).toBe(5);
  });
});
