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

describe('LoanProcessingSystem/EvaluateLoanRequestModule/approveLoanRequest', () => {
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
    service.CurrentLoanRequest = loanRequest;
    const result = service.approveLoanRequest();
    expect(result).toBe(true);
    expect(loanRequest.Status).toBe(LoanRequestStatus.APPROVED);
  });

  it('rejects when precondition is violated', () => {
    const service = new EvaluateLoanRequestModule();
    expectPreconditionRejected(() => service.approveLoanRequest());
  });
});
