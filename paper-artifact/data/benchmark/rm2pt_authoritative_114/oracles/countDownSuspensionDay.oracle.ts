import {User, BorrowStatus, LibraryManagementSystemSystem, getRepository} from './entry';

// Independent evaluation values and assertions; no development fixture imports.
describe('R05 suspension countdown and operation-entry status', () => {
  beforeEach(() => getRepository(User).splice(0));
  it.each([
    {days: 1, fee: 0, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.NORMAL},
    {days: 1, fee: 12.75, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.SUSPEND},
    {days: 7, fee: 0, status: BorrowStatus.SUSPEND, after: 6, state: BorrowStatus.SUSPEND},
    {days: 0, fee: 0, status: BorrowStatus.SUSPEND, after: 0, state: BorrowStatus.SUSPEND},
    {days: 2, fee: 3, status: BorrowStatus.NORMAL, after: 1, state: BorrowStatus.NORMAL},
    {days: 1, fee: 0, status: BorrowStatus.NORMAL, after: 0, state: BorrowStatus.NORMAL},
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
    if (example.days === 0) expect(person.OverDueFee).toBe(example.fee);
  });
  it('processes different users in one call and leaves zero-day users unchanged', () => {
    const people = [
      Object.assign(new User(), {
        SuspensionDays: 1,
        BorrowStatus: BorrowStatus.SUSPEND,
        OverDueFee: 0,
      }),
      Object.assign(new User(), {
        SuspensionDays: 1,
        BorrowStatus: BorrowStatus.SUSPEND,
        OverDueFee: 6,
      }),
      Object.assign(new User(), {
        SuspensionDays: 0,
        BorrowStatus: BorrowStatus.SUSPEND,
        OverDueFee: 0,
      }),
    ];
    getRepository(User).push(...people);
    new LibraryManagementSystemSystem().countDownSuspensionDay();
    expect(people.map((p) => p.SuspensionDays)).toEqual([0, 0, 0]);
    expect(people.map((p) => p.BorrowStatus)).toEqual([
      BorrowStatus.NORMAL,
      BorrowStatus.SUSPEND,
      BorrowStatus.SUSPEND,
    ]);
  });
  it('accepts an empty user repository', () => {
    expect(() => new LibraryManagementSystemSystem().countDownSuspensionDay()).not.toThrow();
  });
});
