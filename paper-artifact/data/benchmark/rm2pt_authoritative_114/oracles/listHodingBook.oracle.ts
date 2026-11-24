import {User, Loan, ListBookHistory, getRepository} from './entry';
import {expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('Source-aligned user holding Loans, not BookCopy projection', () => {
  beforeEach(() => {getRepository(User).splice(0); getRepository(Loan).splice(0);});
  const loan = (returned: boolean, fee = 0) => Object.assign(new Loan(), {IsReturned: returned, OverDueFee: fee});
  const user = (id: string, records: Loan[]) => {
    const value = Object.assign(new User(), {UserID: id, LoanedBook: records});
    getRepository(User).push(value);
    return value;
  };
  const query = (id: string) => new ListBookHistory().listHodingBook(id);
  it('returns an empty Set for an existing user with an empty history', () => {
    user('acceptance-holding', []);
    expectSameMembers(query('acceptance-holding'), []);
  });
  it('selects all unreturned Loans belonging to the requested nonfirst user', () => {
    const foreign = loan(false), returned = loan(true), first = loan(false), second = loan(false);
    user('foreign-holding', [foreign]); user('acceptance-holding', [returned, first, second]);
    getRepository(Loan).push(foreign, returned, first, second);
    expectSameMembers(query('acceptance-holding'), [first, second]);
  });
  it('returns an empty Set when every Loan was returned', () => {
    user('closed-holding', [loan(true, 3), loan(true, 6)]);
    expectSameMembers(query('closed-holding'), []);
  });
  it('returns all unreturned Loans without selecting only the first', () => {
    const records = [loan(false), loan(false), loan(false)]; user('active-holding', records);
    expectSameMembers(query('active-holding'), records);
  });
  it('preserves distinct Loan identities even with equal attributes', () => {
    const first = loan(false, 7), second = loan(false, 7); user('equal-holding', [first, second]);
    expectSameMembers(query('equal-holding'), [first, second]);
  });
  it('navigates association-only Loans without a repository-membership guard', () => {
    const active = loan(false), returned = loan(true); user('linked-holding', [returned, active]);
    expect(getRepository(Loan)).toHaveLength(0);
    expectSameMembers(query('linked-holding'), [active]);
  });
  it('includes zero and negative overdue fees when the Loan is unreturned', () => {
    const records = [loan(false, -3.5), loan(false, 0), loan(false, 0.125)]; user('fee-holding', records);
    expectSameMembers(query('fee-holding'), records);
  });
  it('does not add a nonempty identifier requirement', () => {
    const returned = loan(true), active = loan(false); user('', [returned, active]);
    expectSameMembers(query(''), [active]);
  });
  it('rejects a missing user', () => {
    user('different-holding', [loan(false)]);
    expectPreconditionRejected(() => query('absent-holding'));
  });
});
