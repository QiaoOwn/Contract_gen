import {
  BorrowStatus,
  LibraryManagementSystemSystem,
  User,
  getRepository,
} from '../../../test/LibraryManagementSystem-LibraryManagementSystemSystem-countDownSuspensionDay/entry';
import {clearRepositories} from '../../../test/helpers/contractOracle';

describe('lab adjudication: countDownSuspensionDay', () => {
  beforeEach(() => clearRepositories(getRepository(User)));

  it('uses pre-status and post-decrement days to restore NORMAL', () => {
    const service = new LibraryManagementSystemSystem();
    const restored = new User();
    restored.SuspensionDays = 1;
    restored.BorrowStatus = BorrowStatus.SUSPEND;
    restored.OverDueFee = 0;
    const owing = new User();
    owing.SuspensionDays = 1;
    owing.BorrowStatus = BorrowStatus.SUSPEND;
    owing.OverDueFee = 5;
    const alreadyZero = new User();
    alreadyZero.SuspensionDays = 0;
    alreadyZero.BorrowStatus = BorrowStatus.SUSPEND;
    alreadyZero.OverDueFee = 0;
    getRepository(User).push(restored, owing, alreadyZero);

    service.countDownSuspensionDay();
    expect(restored.SuspensionDays).toBe(0);
    expect(restored.BorrowStatus).toBe(BorrowStatus.NORMAL);
    expect(owing.SuspensionDays).toBe(0);
    expect(owing.BorrowStatus).toBe(BorrowStatus.SUSPEND);
    expect(owing.OverDueFee).toBe(5);
    expect(alreadyZero.SuspensionDays).toBe(0);
    expect(alreadyZero.BorrowStatus).toBe(BorrowStatus.SUSPEND);
  });
});
