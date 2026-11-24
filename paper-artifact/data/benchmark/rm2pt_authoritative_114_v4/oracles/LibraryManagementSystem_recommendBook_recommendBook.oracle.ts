import dayjs from 'dayjs';
import {User, RecommendBook, LibraryManagementSystemSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/recommendBook', () => {
  beforeEach(() => {
    getRepository(User).splice(0);
    getRepository(RecommendBook).splice(0);
  });

  function reader(id: string) {
    const u = Object.assign(new User(), {UserID: id, RecommendedBook: [] as RecommendBook[]});
    getRepository(User).push(u);
    return u;
  }

  function existing(u: User, call: string) {
    const r = Object.assign(new RecommendBook(), {CallNo: call, RecommendUser: u});
    u.RecommendedBook.push(r);
    getRepository(RecommendBook).push(r);
    return r;
  }

  test.each(['K17', ''])('creates exactly one linked RecommendBook for call number %j', call => {
    const other = reader('someone-else');
    const otherRec = existing(other, 'K18');
    const otherBooksBefore = [...other.RecommendedBook];
    const u = reader('target');
    const before = [...getRepository(RecommendBook)];
    // Capture at call time; source sets RecommendDate = Today (invocation-day start).
    const date = dayjs();
    expect(
      new LibraryManagementSystemSystem().recommendBook(
        'target', call, 'Volume', 'Second', 'Writer', 'Press', 'Notes', '007'
      )
    ).toBe(true);
    const added = getRepository(RecommendBook).filter(item => !before.includes(item));
    expect(getRepository(RecommendBook)).toHaveLength(before.length + 1);
    expect(added).toHaveLength(1);
    expect(added[0]).toBeInstanceOf(RecommendBook);
    expect(added[0].CallNo).toBe(call);
    expect(added[0].Title).toBe('Volume');
    expect(added[0].Edition).toBe('Second');
    expect(added[0].Author).toBe('Writer');
    expect(added[0].Publisher).toBe('Press');
    expect(added[0].Description).toBe('Notes');
    expect(added[0].ISBn).toBe('007');
    expect(added[0].RecommendDate?.isSame(date, 'day')).toBe(true);
    expect(added[0].RecommendUser).toBe(u);
    expect(u.RecommendedBook).toEqual([added[0]]);
    expect(getRepository(RecommendBook)).toContain(otherRec);
    expect(other.RecommendedBook).toEqual(otherBooksBefore);
    expect(other.RecommendedBook).toEqual([otherRec]);
  });

  test('requires the requested reader', () => {
    reader('different');
    const before = [...getRepository(RecommendBook)];
    expectPreconditionRejected(() =>
      new LibraryManagementSystemSystem().recommendBook('absent', 'A', 'B', 'C', 'D', 'E', 'F', 'G')
    );
    expect(getRepository(RecommendBook)).toEqual(before);
  });

  test.each(['target', 'other'])('rejects an existing call number recommended by %s without adding', owner => {
    const target = reader('target');
    const other = reader('other');
    const taken = existing(owner === 'target' ? target : other, 'taken');
    const before = [...getRepository(RecommendBook)];
    const targetBooksBefore = [...target.RecommendedBook];
    const otherBooksBefore = [...other.RecommendedBook];
    expectPreconditionRejected(() =>
      new LibraryManagementSystemSystem().recommendBook('target', 'taken', 'B', 'C', 'D', 'E', 'F', 'G')
    );
    expect(getRepository(RecommendBook)).toEqual(before);
    expect(getRepository(RecommendBook)).toContain(taken);
    expect(target.RecommendedBook).toEqual(targetBooksBefore);
    expect(other.RecommendedBook).toEqual(otherBooksBefore);
  });
});
