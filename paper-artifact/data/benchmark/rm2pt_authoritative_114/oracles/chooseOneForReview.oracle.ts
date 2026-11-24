import {LoanRequest, LoanRequestStatus, EvaluateLoanRequestModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('chooseOneForReview source boundaries', () => {
  beforeEach(() => { getRepository(LoanRequest).splice(0); });
  it('selects from current requests and returns the same instance', () => {
    const service = new EvaluateLoanRequestModule();
    const first = Object.assign(new LoanRequest(), {RequestID: 11, Status: LoanRequestStatus.REFERENCESVALIDATED});
    const second = Object.assign(new LoanRequest(), {RequestID: 22, Status: LoanRequestStatus.REFERENCESVALIDATED});
    getRepository(LoanRequest).push(first, second);
    service.CurrentLoanRequests = [first, second];
    service.CurrentLoanRequest = first;
    expect(service.chooseOneForReview(22)).toBe(second);
    expect(service.CurrentLoanRequest).toBe(second);
  });
  it('rejects a repository match outside the current collection', () => {
    const service = new EvaluateLoanRequestModule();
    const first = Object.assign(new LoanRequest(), {RequestID: 11, Status: LoanRequestStatus.REFERENCESVALIDATED});
    const outside = Object.assign(new LoanRequest(), {RequestID: 22, Status: LoanRequestStatus.REFERENCESVALIDATED});
    getRepository(LoanRequest).push(first, outside);
    service.CurrentLoanRequests = [first];
    expectPreconditionRejected(() => service.chooseOneForReview(22));
  });
});
