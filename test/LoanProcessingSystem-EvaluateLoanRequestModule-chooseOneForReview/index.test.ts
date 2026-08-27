import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  EvaluateLoanRequestModule,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanRequestStatus,
  LoanTerm,
  Status,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EvaluateLoanRequestModule/chooseOneForReview', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(ApprovalLetter),
      getRepository(CheckingAccount),
      getRepository(CreditHistory),
      getRepository(Loan),
      getRepository(LoanAccount),
      getRepository(LoanAgreement),
      getRepository(LoanRequest),
      getRepository(LoanTerm)
    );
  });

  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    loanRequest.Status = LoanRequestStatus.REFERENCESVALIDATED;
    service.CurrentLoanRequests = [loanRequest];
    const result = service.chooseOneForReview(loanRequest.RequestID);
    expect(result).toBe(loanRequest);
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });

  it('rejects when request id is not in current list', () => {
    const service = new EvaluateLoanRequestModule();
    service.CurrentLoanRequests = [];
    expectPreconditionRejected(() => service.chooseOneForReview(99));
  });
});
