import {
  LoanRequest, LoanRequestStatus, EnterValidatedCreditReferencesModule, getRepository,
} from './entry';
import {expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/listSubmitedLoanRequest', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
  });

  it('returns every SUBMITTED request only and replaces CurrentLoanRequests with that same set', () => {
    const service = new EnterValidatedCreditReferencesModule();
    const first = Object.assign(new LoanRequest(), {
      RequestID: 11, Status: LoanRequestStatus.SUBMITTED,
    });
    const validated = Object.assign(new LoanRequest(), {
      RequestID: 12, Status: LoanRequestStatus.REFERENCESVALIDATED,
    });
    const second = Object.assign(new LoanRequest(), {
      RequestID: 13, Status: LoanRequestStatus.SUBMITTED,
    });
    const approved = Object.assign(new LoanRequest(), {
      RequestID: 14, Status: LoanRequestStatus.APPROVED,
    });
    getRepository(LoanRequest).push(first, validated, second, approved);
    service.CurrentLoanRequests = [validated];
    const result = service.listSubmitedLoanRequest();
    expectSameMembers(result, [first, second]);
    expectSameMembers(service.CurrentLoanRequests, [first, second]);
    expect(result).not.toContain(validated);
    expect(result).not.toContain(approved);
    expect(validated.Status).toBe(LoanRequestStatus.REFERENCESVALIDATED);
    expect(approved.Status).toBe(LoanRequestStatus.APPROVED);
  });

  it('rejects when the repository has no SUBMITTED request', () => {
    const service = new EnterValidatedCreditReferencesModule();
    const other = Object.assign(new LoanRequest(), {
      RequestID: 99, Status: LoanRequestStatus.REFERENCESVALIDATED,
    });
    getRepository(LoanRequest).push(other);
    service.CurrentLoanRequests = [other];
    expectPreconditionRejected(() => service.listSubmitedLoanRequest());
    expectSameMembers(service.CurrentLoanRequests, [other]);
  });

  it('rejects an empty LoanRequest repository', () => {
    const service = new EnterValidatedCreditReferencesModule();
    service.CurrentLoanRequests = [];
    expectPreconditionRejected(() => service.listSubmitedLoanRequest());
    expect(service.CurrentLoanRequests).toEqual([]);
  });
});
