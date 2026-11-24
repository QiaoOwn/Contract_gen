import {LoanRequest, LoanRequestStatus, EnterValidatedCreditReferencesModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('markRequestValid source boundaries', () => {
  beforeEach(() => { getRepository(LoanRequest).splice(0); });
  function setup() {
    const service = new EnterValidatedCreditReferencesModule();
    const other = Object.assign(new LoanRequest(), {RequestID: 11, Status: LoanRequestStatus.SUBMITTED});
    const target = Object.assign(new LoanRequest(), {RequestID: 22, Status: LoanRequestStatus.SUBMITTED});
    getRepository(LoanRequest).push(other, target);
    service.CurrentLoanRequests = [other, target];
    return {service, other, target};
  }
  it('validates the selected instance and returns true', () => {
    const {service, target} = setup();
    service.CurrentLoanRequest = target;
    expect(service.markRequestValid()).toBe(true);
    expect(target.Status).toBe(LoanRequestStatus.REFERENCESVALIDATED);
  });
  it('rejects without a selected request despite populated repositories', () => {
    const {service} = setup();
    expectPreconditionRejected(() => service.markRequestValid());
  });
});
