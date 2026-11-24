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

describe('LoanProcessingSystem/EnterValidatedCreditReferencesModule/markRequestValid', () => {
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
    service.CurrentLoanRequest = new LoanRequest();
    const result = service.markRequestValid();
    expect(result).toBe(true);
    expect(service.CurrentLoanRequest.Status).toBe(LoanRequestStatus.REFERENCESVALIDATED);
  });

  it('rejects when precondition is violated', () => {
    const service = new EnterValidatedCreditReferencesModule();
    expectPreconditionRejected(() => service.markRequestValid());
  });
});
