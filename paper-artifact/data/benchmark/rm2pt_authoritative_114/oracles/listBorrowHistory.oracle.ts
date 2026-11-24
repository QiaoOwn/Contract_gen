import {User, Loan, ListBookHistory, getRepository} from './entry';
import {expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('Source-aligned complete user Loan history', () => {
  beforeEach(() => {getRepository(User).splice(0); getRepository(Loan).splice(0);});
  const loan = (returned: boolean, fee = 0) => Object.assign(new Loan(), {IsReturned: returned, OverDueFee: fee});
  const user = (id: string, records: Loan[]) => {
    const value = Object.assign(new User(), {UserID: id, LoanedBook: records});
    getRepository(User).push(value);
    return value;
  };
  const query = (id: string) => new ListBookHistory().listBorrowHistory(id);
  it('returns an empty Set for an existing user with no loans', () => {
    user('acceptance-history', []);
    expectSameMembers(query('acceptance-history'), []);
  });
  it('selects the requested user rather than the first or all users', () => {
    const excluded = loan(false), first = loan(true), second = loan(false);
    user('other-history', [excluded]); user('acceptance-history', [first, second]);
    getRepository(Loan).push(excluded, first, second);
    expectSameMembers(query('acceptance-history'), [first, second]);
  });
  it('includes every record when all loans have been returned', () => {
    const records = [loan(true, 2), loan(true, 8)]; user('returned-history', records);
    expectSameMembers(query('returned-history'), records);
  });
  it('includes every record when none has been returned', () => {
    const records = [loan(false), loan(false), loan(false)]; user('active-history', records);
    expectSameMembers(query('active-history'), records);
  });
  it('preserves equal-valued distinct Loan identities', () => {
    const first = loan(false, 4), second = loan(false, 4); user('equal-history', [first, second]);
    expectSameMembers(query('equal-history'), [first, second]);
  });
  it('does not require associated Loans to be independently stored', () => {
    const first = loan(true), second = loan(false); user('linked-history', [first, second]);
    expect(getRepository(Loan)).toHaveLength(0);
    expectSameMembers(query('linked-history'), [first, second]);
  });
  it('does not introduce an overdue-fee eligibility filter', () => {
    const records = [loan(true, -1.75), loan(false, 0), loan(false, 2.25)]; user('fee-history', records);
    expectSameMembers(query('fee-history'), records);
  });
  it('accepts an existing user with an empty identifier', () => {
    const records = [loan(true), loan(false)]; user('', records);
    expectSameMembers(query(''), records);
  });
  it('rejects an absent user rather than returning an empty result', () => {
    user('unrelated-history', [loan(false)]);
    expectPreconditionRejected(() => query('absent-history'));
  });
});
