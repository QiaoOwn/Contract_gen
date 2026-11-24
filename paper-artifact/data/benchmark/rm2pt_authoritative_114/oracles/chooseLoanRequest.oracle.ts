import {LoanRequest, LoanRequestStatus, EnterValidatedCreditReferencesModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('chooseLoanRequest source boundaries', () => {
  beforeEach(() => { getRepository(LoanRequest).splice(0); });
  function setup() {
    const service = new EnterValidatedCreditReferencesModule();
    const other = Object.assign(new LoanRequest(), {RequestID: 11, Status: LoanRequestStatus.SUBMITTED});
    const target = Object.assign(new LoanRequest(), {RequestID: 22, Status: LoanRequestStatus.SUBMITTED});
    getRepository(LoanRequest).push(other, target);
    service.CurrentLoanRequests = [other, target];
    return {service, other, target};
  }
  it('selects by identifier and stores the returned instance', () => {
    const {service, other, target} = setup();
    service.CurrentLoanRequest = other;
    expect(service.chooseLoanRequest(22)).toBe(target);
    expect(service.CurrentLoanRequest).toBe(target);
  });
  it('rejects a repository match outside the current list', () => {
    const {service, other} = setup();
    service.CurrentLoanRequests = [other];
    expectPreconditionRejected(() => service.chooseLoanRequest(22));
  });
});
