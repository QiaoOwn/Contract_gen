import {GenerateLoanLetterAndAgreementModule, LoanAccount, LoanAccountStatus, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/createLoanAccount laboratory-restored draft', () => {
  beforeEach(() => getRepository(LoanAccount).splice(0));

  it.each([
    {id: 29, balance: 571.25, status: LoanAccountStatus.NORMAL},
    {id: 0, balance: 0, status: LoanAccountStatus.HASPAIDINFULL},
    {id: -33, balance: -12.75, status: LoanAccountStatus.NORMAL},
  ])('creates exactly one stored account with the supplied values: %j', values => {
    const existing = Object.assign(new LoanAccount(), {LoanAccountID: 56, Balance: 7,
      Status: LoanAccountStatus.NORMAL});
    getRepository(LoanAccount).push(existing);
    const before = [...getRepository(LoanAccount)];
    expect(new GenerateLoanLetterAndAgreementModule().createLoanAccount(
      values.id, values.balance, values.status
    )).toBe(true);
    const stored = getRepository(LoanAccount);
    const created = stored.filter(item => !before.includes(item));
    expect(stored).toHaveLength(before.length + 1);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(LoanAccount);
    expect(created[0].LoanAccountID).toBe(values.id);
    expect(created[0].Balance).toBe(values.balance);
    expect(created[0].Status).toBe(values.status);
    expect(stored).toContain(existing);
  });

  it('rejects an existing identifier without creating or replacing an account', () => {
    const existing = Object.assign(new LoanAccount(), {LoanAccountID: 9, Balance: 34,
      Status: LoanAccountStatus.NORMAL});
    getRepository(LoanAccount).push(existing);
    expectPreconditionRejected(() => new GenerateLoanLetterAndAgreementModule().createLoanAccount(
      9, 34, LoanAccountStatus.NORMAL
    ));
    expect(getRepository(LoanAccount)).toEqual([existing]);
  });
});
