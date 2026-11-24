import {
  LoanRequest, LoanRequestStatus, EnterValidatedCreditReferencesModule, getRepository,
} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/markRequestValid', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
  });

  function setup() {
    const service = new EnterValidatedCreditReferencesModule();
    const neighbor = Object.assign(new LoanRequest(), {
      RequestID: 11, Status: LoanRequestStatus.SUBMITTED,
    });
    const selected = Object.assign(new LoanRequest(), {
      RequestID: 22, Status: LoanRequestStatus.SUBMITTED,
    });
    getRepository(LoanRequest).push(neighbor, selected);
    service.CurrentLoanRequests = [neighbor, selected];
    return {service, neighbor, selected};
  }

  it('sets only the current request to REFERENCESVALIDATED and returns true', () => {
    const {service, neighbor, selected} = setup();
    service.CurrentLoanRequest = selected;
    expect(service.markRequestValid()).toBe(true);
    expect(selected.Status).toBe(LoanRequestStatus.REFERENCESVALIDATED);
    expect(neighbor.Status).toBe(LoanRequestStatus.SUBMITTED);
    expect(service.CurrentLoanRequest).toBe(selected);
    expect(getRepository(LoanRequest)).toEqual([neighbor, selected]);
  });

  it('rejects without a current request despite populated repositories and leaves neighbors unchanged', () => {
    const {service, neighbor, selected} = setup();
    expectPreconditionRejected(() => service.markRequestValid());
    expect(neighbor.Status).toBe(LoanRequestStatus.SUBMITTED);
    expect(selected.Status).toBe(LoanRequestStatus.SUBMITTED);
    expect(getRepository(LoanRequest)).toEqual([neighbor, selected]);
  });
});
