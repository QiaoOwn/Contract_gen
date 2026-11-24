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
  getRepository,
} from './entry';
import {clearRepositories} from '../helpers/contractOracle';

// Precondition only checks that the select() collection is defined; filter always
// returns an array, so rejection is unreachable without NPE — treat as vacuous.
describe('LoanProcessingSystem/EvaluateLoanRequestModule/listTenLoanRequest', () => {
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
    loanRequest.Status = LoanRequestStatus.REFERENCESVALIDATED;
    getRepository(LoanRequest).push(loanRequest);
    service.CurrentLoanRequests = [];
    const result = service.listTenLoanRequest();
    expect(result).toContain(loanRequest);
    expect(service.CurrentLoanRequests).toContain(loanRequest);
  });

  it('selects only requests whose references are validated', () => {
    const service = new EvaluateLoanRequestModule();
    const validatedA = new LoanRequest();
    validatedA.Status = LoanRequestStatus.REFERENCESVALIDATED;
    const submitted = new LoanRequest();
    submitted.Status = LoanRequestStatus.SUBMITTED;
    const validatedB = new LoanRequest();
    validatedB.Status = LoanRequestStatus.REFERENCESVALIDATED;
    getRepository(LoanRequest).push(validatedA, submitted, validatedB);

    const result = service.listTenLoanRequest();

    expect(result).toEqual([validatedA, validatedB]);
    expect(result).not.toContain(submitted);
    expect(service.CurrentLoanRequests).toEqual(result);
  });
});
