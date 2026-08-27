import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  EnterValidatedCreditReferencesModule,
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

describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/listSubmitedLoanRequest', () => {
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
    const service = new EnterValidatedCreditReferencesModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.SUBMITTED;
    getRepository(LoanRequest).push(loanRequest);
    const result = service.listSubmitedLoanRequest();
    expect(result).toContain(loanRequest);
    expect(service.CurrentLoanRequests).toBe(result);
  });

  it('rejects when precondition is violated', () => {
    const service = new EnterValidatedCreditReferencesModule();
    expectPreconditionRejected(() => service.listSubmitedLoanRequest());
  });
});
