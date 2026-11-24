import {LoanRequest, LoanRequestStatus, EvaluateLoanRequestModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('approveLoanRequest source boundaries', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
  });

  it('approves only the current request and leaves a neighbor unchanged', () => {
    const service = new EvaluateLoanRequestModule();
    const other = Object.assign(new LoanRequest(), {
      RequestID: 11,
      Status: LoanRequestStatus.SUBMITTED,
    });
    const selected = Object.assign(new LoanRequest(), {
      RequestID: 22,
      Status: LoanRequestStatus.REFERENCESVALIDATED,
    });
    getRepository(LoanRequest).push(other, selected);
    service.CurrentLoanRequest = selected;
    expect(service.approveLoanRequest()).toBe(true);
    expect(selected.Status).toBe(LoanRequestStatus.APPROVED);
    expect(other.Status).toBe(LoanRequestStatus.SUBMITTED);
    expect(service.CurrentLoanRequest).toBe(selected);
    expect(getRepository(LoanRequest)).toEqual([other, selected]);
  });

  it('rejects without a current request despite other requests existing', () => {
    const service = new EvaluateLoanRequestModule();
    const other = Object.assign(new LoanRequest(), {
      RequestID: 11,
      Status: LoanRequestStatus.REFERENCESVALIDATED,
    });
    getRepository(LoanRequest).push(other);
    expectPreconditionRejected(() => service.approveLoanRequest());
    expect(other.Status).toBe(LoanRequestStatus.REFERENCESVALIDATED);
  });
});
