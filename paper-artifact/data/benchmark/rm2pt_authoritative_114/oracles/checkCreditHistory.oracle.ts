import {LoanRequest, CreditHistory, EvaluateLoanRequestModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('checkCreditHistory source boundaries', () => {
  beforeEach(() => { getRepository(LoanRequest).splice(0); getRepository(CreditHistory).splice(0); });
  it('returns the selected request linked instance, not another instance of the same type', () => {
    const service = new EvaluateLoanRequestModule();
    const first = new LoanRequest();
    const second = new LoanRequest();
    const firstHistory = new CreditHistory();
    const secondHistory = new CreditHistory();
    first.RequestedCreditHistory = firstHistory;
    second.RequestedCreditHistory = secondHistory;
    getRepository(LoanRequest).push(first, second);
    getRepository(CreditHistory).push(firstHistory, secondHistory);
    service.CurrentLoanRequest = second;
    expect(service.checkCreditHistory()).toBe(secondHistory);
  });
  it('rejects a missing current request even when another request has a linked object', () => {
    const service = new EvaluateLoanRequestModule();
    const other = new LoanRequest();
    other.RequestedCreditHistory = new CreditHistory();
    getRepository(LoanRequest).push(other);
    expectPreconditionRejected(() => service.checkCreditHistory());
  });
  it('rejects a current request without the required link', () => {
    const service = new EvaluateLoanRequestModule();
    service.CurrentLoanRequest = new LoanRequest();
    expectPreconditionRejected(() => service.checkCreditHistory());
  });
});
