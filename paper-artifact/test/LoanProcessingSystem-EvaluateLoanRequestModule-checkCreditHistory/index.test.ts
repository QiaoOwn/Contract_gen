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

describe('LoanProcessingSystem/EvaluateLoanRequestModule/checkCreditHistory', () => {
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

  it('Happy Path: returns the requested credit history', () => {
    const service = new EvaluateLoanRequestModule();
    const loanRequest = new LoanRequest();
    loanRequest.RequestID = 1;
    const creditHistory = new CreditHistory();
    loanRequest.RequestedCreditHistory = creditHistory;
    service.CurrentLoanRequest = loanRequest;
    expect(service.checkCreditHistory()).toBe(creditHistory);
  });

  it('rejects when CurrentLoanRequest is missing', () => {
    const service = new EvaluateLoanRequestModule();
    expectPreconditionRejected(() => service.checkCreditHistory());
  });

  it('rejects when RequestedCreditHistory is missing', () => {
    const service = new EvaluateLoanRequestModule();
    service.CurrentLoanRequest = new LoanRequest();
    expectPreconditionRejected(() => service.checkCreditHistory());
  });
});
