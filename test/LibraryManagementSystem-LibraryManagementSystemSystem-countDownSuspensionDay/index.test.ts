import {BorrowStatus, getRepository, LibraryManagementSystemSystem, User} from './entry';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/countDownSuspensionDay', () => {
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
});
