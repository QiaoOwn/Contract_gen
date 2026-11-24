import {LoanRequest, CheckingAccount, EvaluateLoanRequestModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('reviewCheckingAccount source boundaries', () => {
  beforeEach(() => { getRepository(LoanRequest).splice(0); getRepository(CheckingAccount).splice(0); });
  it('returns the selected request linked instance, not another instance of the same type', () => {
    const service = new EvaluateLoanRequestModule();
    const first = new LoanRequest();
    const second = new LoanRequest();
    const firstHistory = new CheckingAccount();
    const secondHistory = new CheckingAccount();
    first.RequestedCAHistory = firstHistory;
    second.RequestedCAHistory = secondHistory;
    getRepository(LoanRequest).push(first, second);
    getRepository(CheckingAccount).push(firstHistory, secondHistory);
    service.CurrentLoanRequest = second;
    expect(service.reviewCheckingAccount()).toBe(secondHistory);
  });
  it('rejects a missing current request even when another request has a linked object', () => {
    const service = new EvaluateLoanRequestModule();
    const other = new LoanRequest();
    other.RequestedCAHistory = new CheckingAccount();
    getRepository(LoanRequest).push(other);
    expectPreconditionRejected(() => service.reviewCheckingAccount());
  });
  it('rejects a current request without the required link', () => {
    const service = new EvaluateLoanRequestModule();
    service.CurrentLoanRequest = new LoanRequest();
    expectPreconditionRejected(() => service.reviewCheckingAccount());
  });
});
