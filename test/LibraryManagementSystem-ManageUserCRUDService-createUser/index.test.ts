import {BorrowStatus, getRepository, ManageUserCRUDService, Sex, User} from './entry';
describe('LibraryManagementSystem/ManageUserCRUDService/createUser', () => {
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
});
