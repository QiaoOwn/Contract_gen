import {getRepository, LibraryManagementSystemSystem, Loan, User} from './entry';
import dayjs from 'dayjs';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/payOverDueFee', () => {
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
});
