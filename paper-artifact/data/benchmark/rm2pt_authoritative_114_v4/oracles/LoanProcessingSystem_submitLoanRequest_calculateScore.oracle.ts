import {
  LoanRequest, LoanRequestStatus, CheckingAccount, CreditHistory,
  SubmitLoanRequestModule, getRepository,
} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/SubmitLoanRequestModule/calculateScore', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
  });

  it('sets only the current request score and status to 100/SUBMITTED and returns 100', () => {
    const service = new SubmitLoanRequestModule();
    const other = Object.assign(new LoanRequest(), {
      RequestID: 11, CreditScore: 5, Status: LoanRequestStatus.APPROVED,
    });
    const selected = Object.assign(new LoanRequest(), {
      RequestID: 22, CreditScore: 7, Status: LoanRequestStatus.APPROVED,
      RequestedCAHistory: new CheckingAccount(),
      RequestedCreditHistory: new CreditHistory(),
    });
    getRepository(LoanRequest).push(other, selected);
    service.CurrentLoanRequest = selected;
    expect(service.calculateScore()).toBe(100);
    expect(selected.CreditScore).toBe(100);
    expect(selected.Status).toBe(LoanRequestStatus.SUBMITTED);
    expect(other.CreditScore).toBe(5);
    expect(other.Status).toBe(LoanRequestStatus.APPROVED);
    expect(getRepository(LoanRequest)).toEqual([other, selected]);
    expect(service.CurrentLoanRequest).toBe(selected);
  });

  it('rejects without the current request', () => {
    expectPreconditionRejected(() => new SubmitLoanRequestModule().calculateScore());
  });

  it.each(['RequestedCAHistory', 'RequestedCreditHistory'] as const)(
    'rejects without %s and leaves the current request unchanged',
    missing => {
      const service = new SubmitLoanRequestModule();
      const request = Object.assign(new LoanRequest(), {
        RequestID: 22, CreditScore: 7, Status: LoanRequestStatus.APPROVED,
        RequestedCAHistory: new CheckingAccount(),
        RequestedCreditHistory: new CreditHistory(),
      });
      request[missing] = undefined;
      service.CurrentLoanRequest = request;
      expectPreconditionRejected(() => service.calculateScore());
      expect(request.CreditScore).toBe(7);
      expect(request.Status).toBe(LoanRequestStatus.APPROVED);
      expect(service.CurrentLoanRequest).toBe(request);
    },
  );
});
