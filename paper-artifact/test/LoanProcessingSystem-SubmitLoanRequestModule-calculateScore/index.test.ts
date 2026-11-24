import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanRequestStatus,
  LoanTerm,
  Status,
  SubmitLoanRequestModule,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/SubmitLoanRequestModule/calculateScore', () => {
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
    const service = new SubmitLoanRequestModule();
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.RequestedCAHistory = new CheckingAccount();
    service.CurrentLoanRequest.RequestedCreditHistory = new CreditHistory();
    const result = service.calculateScore();
    expect(result).toBe(100);
    expect(service.CurrentLoanRequest.CreditScore).toBe(100);
    expect(service.CurrentLoanRequest.Status).toBe(LoanRequestStatus.SUBMITTED);
  });

  it('rejects when precondition is violated', () => {
    const service = new SubmitLoanRequestModule();
    expectPreconditionRejected(() => service.calculateScore());
  });
});
