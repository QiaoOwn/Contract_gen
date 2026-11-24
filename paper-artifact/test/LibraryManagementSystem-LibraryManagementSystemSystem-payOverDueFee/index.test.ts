import dayjs from 'dayjs';
import {
  Administrator,
  Book,
  BookCopy,
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
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/payOverDueFee', () => {
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
    user.OverDueFee = 1;
    const loan = new Loan();
    loan.LoanedUser = user;
    loan.DueDate = dayjs().subtract(1, 'd');
    loan.IsReturned = true;
    loan.OverDueFee = 1;
    getRepository(User).push(user);
    getRepository(Loan).push(loan);
    const result = service.payOverDueFee(user.UserID, 2);
    expect(result).toBe(true);
    expect(user.OverDueFee).toBe(0);
    expect(loan.OverDueFee).toBe(0);
  });

  it('rejects when fee is less than outstanding overdue fee', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    user.OverDueFee = 5;
    const loan = new Loan();
    loan.LoanedUser = user;
    loan.DueDate = dayjs().subtract(1, 'd');
    loan.IsReturned = true;
    loan.OverDueFee = 5;
    getRepository(User).push(user);
    getRepository(Loan).push(loan);
    expectPreconditionRejected(() => service.payOverDueFee(user.UserID, 1));
    expect(user.OverDueFee).toBe(5);
    expect(loan.OverDueFee).toBe(5);
  });
});
