import {expectSameMembers} from '../helpers/setOracle';
import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  GenerateLoanLetterAndAgreementModule,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanRequestStatus,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories} from '../helpers/contractOracle';

// Precondition only checks that the select() collection is defined; filter always
// returns an array, so rejection is unreachable without NPE — treat as vacuous.
describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/listApprovalRequest', () => {
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
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.APPROVED;
    getRepository(LoanRequest).push(loanRequest);
    const result = service.listApprovalRequest();
    expectSameMembers(result, [loanRequest]);
    expectSameMembers(service.CurrentLoanRequests, [loanRequest]);
  });

  it('selects approved requests and excludes all other statuses', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const approvedA = new LoanRequest();
    approvedA.Status = LoanRequestStatus.APPROVED;
    const submitted = new LoanRequest();
    submitted.Status = LoanRequestStatus.SUBMITTED;
    const approvedB = new LoanRequest();
    approvedB.Status = LoanRequestStatus.APPROVED;
    getRepository(LoanRequest).push(approvedA, submitted, approvedB);

    const result = service.listApprovalRequest();

    expectSameMembers(result, [approvedA, approvedB]);
    expectSameMembers(service.CurrentLoanRequests, [approvedA, approvedB]);
  });
});
