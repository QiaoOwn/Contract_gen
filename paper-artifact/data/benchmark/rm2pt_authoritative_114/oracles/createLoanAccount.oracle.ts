import {GenerateLoanLetterAndAgreementModule, LoanAccount, LoanAccountStatus, getRepository} from './entry';

// Evaluation-only: R09 laboratory-approved restoration, not the active third-party contract.
describe('R09 restored loan-account creation', () => {
  beforeEach(() => getRepository(LoanAccount).splice(0));
  it.each([{id: 29, balance: 571.25, status: LoanAccountStatus.NORMAL},
    {id: 0, balance: 0, status: LoanAccountStatus.HASPAIDINFULL},
    {id: -33, balance: -12.75, status: LoanAccountStatus.NORMAL}])('creates and stores the supplied account without extra range rules: %j', values => {
    const existing = Object.assign(new LoanAccount(), {LoanAccountID: 56, Balance: 7, Status: LoanAccountStatus.NORMAL});
    getRepository(LoanAccount).push(existing);
    const before = [...getRepository(LoanAccount)];
    expect(new GenerateLoanLetterAndAgreementModule().createLoanAccount(values.id, values.balance, values.status)).toBe(true);
    const fresh = getRepository(LoanAccount).filter(item => !before.includes(item));
    const created = fresh.find(item => item.LoanAccountID === values.id);
    expect(created).toBeDefined();
    expect(created?.Balance).toBe(values.balance);
    expect(created?.Status).toBe(values.status);
  });
  it('rejects a duplicate account identifier', () => {
    getRepository(LoanAccount).push(Object.assign(new LoanAccount(), {LoanAccountID: 9}));
    expect(() => new GenerateLoanLetterAndAgreementModule().createLoanAccount(9, 34, LoanAccountStatus.NORMAL))
      .toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
});
