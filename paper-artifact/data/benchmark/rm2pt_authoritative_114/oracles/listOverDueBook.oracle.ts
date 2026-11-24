import {User, Loan, BookCopy, ListBookHistory, getRepository} from './entry';

describe('R06 exact identity Set of overdue loan copies', () => {
  beforeEach(() => {
    for (const ctor of [User, Loan, BookCopy]) getRepository<object>(ctor).splice(0);
  });
  const copy = () =>
    Object.assign(new BookCopy(), {Barcode: 'same-acceptance-barcode', Location: 'C3'});
  const loan = (item: BookCopy, fee: number, returned = false) =>
    Object.assign(new Loan(), {LoanedCopy: item, IsReturned: returned, OverDueFee: fee});
  const user = (id: string, history?: Loan[]) => {
    const person = Object.assign(new User(), {
      UserID: id,
      ...(history === undefined ? {} : {LoanedBook: history}),
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
  it('counts a shared copy once despite distinct qualifying loan records', () => {
    const item = copy();
    user('acceptance-a', [loan(item, 11), loan(item, 0.75)]);
    getRepository(BookCopy).push(item);
    check(new ListBookHistory().listOverDueBook('acceptance-a'), [item]);
  });
  it('keeps two different copies even when all initialized attributes are equal', () => {
    const first = copy(),
      second = copy();
    user('acceptance-a', [loan(first, 0.25), loan(second, 9)]);
    getRepository(BookCopy).push(first, second);
    check(new ListBookHistory().listOverDueBook('acceptance-a'), [first, second]);
  });
  it('filters returned, zero-fee and negative-fee loans and excludes another user', () => {
    const yes = copy(),
      returned = copy(),
      zero = copy(),
      negative = copy(),
      foreign = copy();
    user('acceptance-a', [
      loan(yes, 0.125),
      loan(returned, 6, true),
      loan(zero, 0),
      loan(negative, -2),
    ]);
    user('acceptance-b', [loan(foreign, 13)]);
    getRepository(BookCopy).push(yes, returned, zero, negative, foreign);
    check(new ListBookHistory().listOverDueBook('acceptance-a'), [yes]);
  });
  it('uses association reachability, not a new copy-repository eligibility condition', () => {
    const item = copy();
    user('acceptance-a', [loan(item, 3.25)]);
    expect(getRepository(BookCopy)).toHaveLength(0);
    check(new ListBookHistory().listOverDueBook('acceptance-a'), [item]);
  });
  it('returns an empty Set for an empty resolved history', () => {
    user('acceptance-a', []);
    check(new ListBookHistory().listOverDueBook('acceptance-a'), []);
  });
  it('accepts an existing user whose ID is the empty string', () => {
    const item = copy();
    user('', [loan(item, 1.5)]);
    getRepository(BookCopy).push(item);
    check(new ListBookHistory().listOverDueBook(''), [item]);
  });
  it('rejects a missing user', () => {
    expect(() => new ListBookHistory().listOverDueBook('missing')).toThrow(/Precondition/i);
  });
  it('rejects an unresolved source collection', () => {
    user('acceptance-a');
    expect(() => new ListBookHistory().listOverDueBook('acceptance-a')).toThrow(/Precondition/i);
  });
});
