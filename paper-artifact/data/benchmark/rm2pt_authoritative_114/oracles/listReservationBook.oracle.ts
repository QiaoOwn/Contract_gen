import {User, Reserve, BookCopy, ListBookHistory, getRepository} from './entry';

describe('R07 identity Set of all selected-user reservation copies', () => {
  beforeEach(() => {
    for (const ctor of [User, Reserve, BookCopy]) getRepository<object>(ctor).splice(0);
  });
  const copy = () =>
    Object.assign(new BookCopy(), {Barcode: 'equal-acceptance-copy', Location: 'D8'});
  const reserve = (item: BookCopy, closed: boolean) =>
    Object.assign(new Reserve(), {ReservedCopy: item, IsReserveClosed: closed});
  const user = (id: string, records?: Reserve[]) => {
    const person = Object.assign(new User(), {
      UserID: id,
      ...(records === undefined ? {} : {ReservedBook: records}),
    });
    getRepository(User).push(person);
    return person;
  };
  const check = (actual: unknown, expected: BookCopy[]) => {
    expect(Array.isArray(actual)).toBe(true);
    const values = actual as BookCopy[];
    expect(values).toHaveLength(expected.length);
    expect(new Set(values).size).toBe(values.length);
    for (const item of expected) expect(values).toContain(item);
  };
  it('returns one identity shared by different open and closed records', () => {
    const item = copy();
    user('review-a', [reserve(item, false), reserve(item, true)]);
    getRepository(BookCopy).push(item);
    check(new ListBookHistory().listReservationBook('review-a'), [item]);
  });
  it('preserves different equal-attribute copy identities', () => {
    const first = copy(),
      second = copy();
    user('review-a', [reserve(first, false), reserve(second, true)]);
    getRepository(BookCopy).push(first, second);
    check(new ListBookHistory().listReservationBook('review-a'), [first, second]);
  });
  it('includes an exclusively closed reservation and excludes another user', () => {
    const closed = copy(),
      foreign = copy();
    user('review-a', [reserve(closed, true)]);
    user('review-b', [reserve(foreign, false)]);
    getRepository(BookCopy).push(closed, foreign);
    check(new ListBookHistory().listReservationBook('review-a'), [closed]);
  });
  it('does not require separately registering association-reachable copies', () => {
    const item = copy();
    user('review-a', [reserve(item, true)]);
    expect(getRepository(BookCopy)).toHaveLength(0);
    check(new ListBookHistory().listReservationBook('review-a'), [item]);
  });
  it('accepts an empty resolved reservation collection', () => {
    user('review-a', []);
    check(new ListBookHistory().listReservationBook('review-a'), []);
  });
  it('accepts an existing empty user ID', () => {
    const item = copy();
    user('', [reserve(item, true)]);
    getRepository(BookCopy).push(item);
    check(new ListBookHistory().listReservationBook(''), [item]);
  });
  it('rejects an unknown user', () => {
    expect(() => new ListBookHistory().listReservationBook('missing')).toThrow(/Precondition/i);
  });
  it('rejects an unresolved reservation collection', () => {
    user('review-a');
    expect(() => new ListBookHistory().listReservationBook('review-a')).toThrow(/Precondition/i);
  });
});
