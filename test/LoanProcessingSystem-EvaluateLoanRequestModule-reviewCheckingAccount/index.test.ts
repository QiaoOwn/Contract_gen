import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  EvaluateLoanRequestModule,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EvaluateLoanRequestModule/reviewCheckingAccount', () => {
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
    const checkingAccount = new CheckingAccount();
    loanRequest.RequestedCAHistory = checkingAccount;
    service.CurrentLoanRequest = loanRequest;
    const result = service.reviewCheckingAccount();
    expect(result).toBe(checkingAccount);
  });

  it('rejects when precondition is violated', () => {
    const service = new EvaluateLoanRequestModule();
    expectPreconditionRejected(() => service.reviewCheckingAccount());
  });
});
