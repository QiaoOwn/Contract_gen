import {
  LoanRequest, LoanRequestStatus, EnterValidatedCreditReferencesModule, getRepository,
} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/chooseLoanRequest', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
  });

  function setup() {
    const service = new EnterValidatedCreditReferencesModule();
    const other = Object.assign(new LoanRequest(), {
      RequestID: 11, Status: LoanRequestStatus.SUBMITTED,
    });
    const target = Object.assign(new LoanRequest(), {
      RequestID: 22, Status: LoanRequestStatus.SUBMITTED,
    });
    getRepository(LoanRequest).push(other, target);
    service.CurrentLoanRequests = [other, target];
    return {service, other, target};
  }

  it('selects only from CurrentLoanRequests by identifier and stores the returned instance', () => {
    const {service, other, target} = setup();
    service.CurrentLoanRequest = other;
    expect(service.chooseLoanRequest(22)).toBe(target);
    expect(service.CurrentLoanRequest).toBe(target);
    expect(service.CurrentLoanRequests).toEqual([other, target]);
  });

  it('rejects a repository match that is outside the current request collection', () => {
    const {service, other, target} = setup();
    service.CurrentLoanRequests = [other];
    service.CurrentLoanRequest = other;
    expectPreconditionRejected(() => service.chooseLoanRequest(22));
    expect(service.CurrentLoanRequest).toBe(other);
    expect(getRepository(LoanRequest)).toEqual([other, target]);
  });

  it('rejects when CurrentLoanRequests is empty even if the repository has the identifier', () => {
    const {service, other, target} = setup();
    service.CurrentLoanRequests = [];
    service.CurrentLoanRequest = other;
    expectPreconditionRejected(() => service.chooseLoanRequest(22));
    expect(service.CurrentLoanRequest).toBe(other);
    expect(getRepository(LoanRequest)).toEqual([other, target]);
  });
});
