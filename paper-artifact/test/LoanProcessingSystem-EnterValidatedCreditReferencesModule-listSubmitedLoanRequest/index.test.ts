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
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

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

  it('returns only SUBMITTED requests and assigns CurrentLoanRequests', () => {
    const service = new EnterValidatedCreditReferencesModule();
    const submitted = new LoanRequest();
    submitted.Status = LoanRequestStatus.SUBMITTED;
    const other = new LoanRequest();
    other.Status = LoanRequestStatus.REFERENCESVALIDATED;
    getRepository(LoanRequest).push(other, submitted);

    const result = service.listSubmitedLoanRequest();
    expectSameMembers(result, [submitted]);
    expectSameMembers(service.CurrentLoanRequests, [submitted]);
  });

  it('rejects when no submitted request exists', () => {
    const service = new EnterValidatedCreditReferencesModule();
    const other = new LoanRequest();
    other.Status = LoanRequestStatus.REFERENCESVALIDATED;
    getRepository(LoanRequest).push(other);
    expectPreconditionRejected(() => service.listSubmitedLoanRequest());
  });
});
