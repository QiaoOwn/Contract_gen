import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  EnterValidatedCreditReferencesModule,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/chooseLoanRequest', () => {
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
    loanRequest.RequestID = 1;
    service.CurrentLoanRequests = [loanRequest];
    const result = service.chooseLoanRequest(loanRequest.RequestID);
    expect(result).toBe(loanRequest);
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });

  it('rejects when request id is not in current list', () => {
    const service = new EnterValidatedCreditReferencesModule();
    service.CurrentLoanRequests = [];
    expectPreconditionRejected(() => service.chooseLoanRequest(99));
  });
});
