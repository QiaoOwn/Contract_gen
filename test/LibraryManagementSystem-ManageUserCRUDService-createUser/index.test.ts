import {
  Administrator,
  Book,
  BookCopy,
  BorrowStatus,
  Faculty,
  Librarian,
  Loan,
  ManageUserCRUDService,
  RecommendBook,
  Reserve,
  Sex,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageUserCRUDService/createUser', () => {
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
    const service = new ManageUserCRUDService();
    const result = service.createUser('1', '2', Sex.F, '3', '4', '5', 1, BorrowStatus.NORMAL, 2, 3);
    expect(result).toBe(true);
    const user = getRepository(User)[0];
    expect(user.UserID).toBe('1');
    expect(user.Name).toBe('2');
    expect(user.Sex).toBe(Sex.F);
    expect(user.Password).toBe('3');
    expect(user.Email).toBe('4');
    expect(user.Faculty).toBe('5');
    expect(user.LoanedNumber).toBe(1);
    expect(user.BorrowStatus).toBe(BorrowStatus.NORMAL);
    expect(user.SuspensionDays).toBe(2);
    expect(user.OverDueFee).toBe(3);
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageUserCRUDService();
    const result = service.createUser('1', '2', Sex.F, '3', '4', '5', 1, BorrowStatus.NORMAL, 2, 3);
    expect(result).toBe(true);
    const user = getRepository(User)[0];
    expect(user.UserID).toBe('1');
    expect(user.Name).toBe('2');
    expect(user.Sex).toBe(Sex.F);
    expect(user.Password).toBe('3');
    expect(user.Email).toBe('4');
    expect(user.Faculty).toBe('5');
    expect(user.LoanedNumber).toBe(1);
    expect(user.BorrowStatus).toBe(BorrowStatus.NORMAL);
    expect(user.SuspensionDays).toBe(2);
    expect(user.OverDueFee).toBe(3);
    const again = new ManageUserCRUDService();
    expectPreconditionRejected(() =>
      again.createUser('1', '2', Sex.F, '3', '4', '5', 1, BorrowStatus.NORMAL, 2, 3)
    );
  });
});
