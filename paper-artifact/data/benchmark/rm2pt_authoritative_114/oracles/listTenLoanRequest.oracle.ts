import {LoanRequest, LoanRequestStatus, EvaluateLoanRequestModule, getRepository} from './entry';
import {expectSameMembers} from '../helpers/contractOracle';

describe('listTenLoanRequest source boundaries', () => {
  beforeEach(() => { getRepository(LoanRequest).splice(0); });
  it('selects only validated requests and replaces stale current collection', () => {
    const service = new EvaluateLoanRequestModule();
    const first = Object.assign(new LoanRequest(), {RequestID: 11, Status: LoanRequestStatus.REFERENCESVALIDATED});
    const other = Object.assign(new LoanRequest(), {RequestID: 12, Status: LoanRequestStatus.SUBMITTED});
    const second = Object.assign(new LoanRequest(), {RequestID: 13, Status: LoanRequestStatus.REFERENCESVALIDATED});
    getRepository(LoanRequest).push(first, other, second);
    service.CurrentLoanRequests = [other];
    expectSameMembers(service.listTenLoanRequest(), [first, second]);
    expectSameMembers(service.CurrentLoanRequests, [first, second]);
  });
  it('does not impose an unsupported ten-request cap', () => {
    const service = new EvaluateLoanRequestModule();
    const requests = Array.from({length: 13}, (_, i) =>
      Object.assign(new LoanRequest(), {RequestID: i + 1, Status: LoanRequestStatus.REFERENCESVALIDATED}));
    getRepository(LoanRequest).push(...requests);
    expectSameMembers(service.listTenLoanRequest(), requests);
    expectSameMembers(service.CurrentLoanRequests, requests);
  });
  it('returns a defined empty selection when none match', () => {
    const service = new EvaluateLoanRequestModule();
    const other = Object.assign(new LoanRequest(), {RequestID: 99, Status: LoanRequestStatus.SUBMITTED});
    getRepository(LoanRequest).push(other);
    service.CurrentLoanRequests = [other];
    expect(service.listTenLoanRequest()).toEqual([]);
    expect(service.CurrentLoanRequests).toEqual([]);
  });
});
