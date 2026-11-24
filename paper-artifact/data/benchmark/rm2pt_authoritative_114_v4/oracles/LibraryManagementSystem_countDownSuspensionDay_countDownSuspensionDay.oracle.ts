import {User, BorrowStatus, LibraryManagementSystemSystem, getRepository} from './entry';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/countDownSuspensionDay', () => {
  beforeEach(() => getRepository(User).splice(0));

  // P1: precondition is true — empty and non-empty repositories both complete.
  // There is no constructible violating business precondition; do not invent a reject path.
  it('accepts an empty user repository', () => {
    expect(() => new LibraryManagementSystemSystem().countDownSuspensionDay()).not.toThrow();
    expect(getRepository(User)).toEqual([]);
  });

  // Same-call multi-user fixture: 1-day free, 1-day with fee, multi-day, zero-day, and NORMAL.
  it('applies each user transition from its own pre-state in one call', () => {
    const freeOneDay = Object.assign(new User(), {
      UserID: 'free-one-day',
      SuspensionDays: 1,
      BorrowStatus: BorrowStatus.SUSPEND,
      OverDueFee: 0,
    });
    const feeOneDay = Object.assign(new User(), {
      UserID: 'fee-one-day',
      SuspensionDays: 1,
      BorrowStatus: BorrowStatus.SUSPEND,
      OverDueFee: 6,
    });
    const multiDay = Object.assign(new User(), {
      UserID: 'multi-day',
      SuspensionDays: 7,
      BorrowStatus: BorrowStatus.SUSPEND,
      OverDueFee: 0,
    });
    const zeroDaySuspend = Object.assign(new User(), {
      UserID: 'zero-day-suspend',
      SuspensionDays: 0,
      BorrowStatus: BorrowStatus.SUSPEND,
      OverDueFee: 4.5,
    });
    const normalPositive = Object.assign(new User(), {
      UserID: 'normal-positive',
      SuspensionDays: 2,
      BorrowStatus: BorrowStatus.NORMAL,
      OverDueFee: 3,
    });
    const normalZero = Object.assign(new User(), {
      UserID: 'normal-zero',
      SuspensionDays: 0,
      BorrowStatus: BorrowStatus.NORMAL,
      OverDueFee: 0,
    });
    const people = [freeOneDay, feeOneDay, multiDay, zeroDaySuspend, normalPositive, normalZero];
    getRepository(User).push(...people);

    new LibraryManagementSystemSystem().countDownSuspensionDay();

    expect(people.map((p) => p.UserID)).toEqual([
      'free-one-day',
      'fee-one-day',
      'multi-day',
      'zero-day-suspend',
      'normal-positive',
      'normal-zero',
    ]);
    expect(people.map((p) => p.SuspensionDays)).toEqual([0, 0, 6, 0, 1, 0]);
    expect(people.map((p) => p.BorrowStatus)).toEqual([
      BorrowStatus.NORMAL,
      BorrowStatus.SUSPEND,
      BorrowStatus.SUSPEND,
      BorrowStatus.SUSPEND,
      BorrowStatus.NORMAL,
      BorrowStatus.NORMAL,
    ]);
    expect(people.map((p) => p.OverDueFee)).toEqual([0, 6, 0, 4.5, 3, 0]);
    expect(getRepository(User)).toEqual(people);
  });

  it.each([
    {days: 1, fee: 0, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.NORMAL},
    {days: 1, fee: 12.75, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.SUSPEND},
    {days: 7, fee: 0, status: BorrowStatus.SUSPEND, after: 6, state: BorrowStatus.SUSPEND},
    {days: 0, fee: 0, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.SUSPEND},
    {days: 0, fee: 9, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.SUSPEND},
    {days: 2, fee: 3, status: BorrowStatus.NORMAL, after: 1, state: BorrowStatus.NORMAL},
    {days: 1, fee: 0, status: BorrowStatus.NORMAL, after: 0, state: BorrowStatus.NORMAL},
    {days: 0, fee: 0, status: BorrowStatus.NORMAL, after: 0, state: BorrowStatus.NORMAL},
  ])('applies only the approved transition: %j', (example) => {
    const person = Object.assign(new User(), {
      UserID: 'acceptance-clock',
      SuspensionDays: example.days,
      BorrowStatus: example.status,
      OverDueFee: example.fee,
    });
    getRepository(User).push(person);
    new LibraryManagementSystemSystem().countDownSuspensionDay();
    expect(person.SuspensionDays).toBe(example.after);
    expect(person.BorrowStatus).toBe(example.state);
    expect(person.OverDueFee).toBe(example.fee);
    expect(person.SuspensionDays).toBeGreaterThanOrEqual(0);
  });
});
