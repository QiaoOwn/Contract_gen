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
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

/**
 * TOSEM adjudication (INT-FID-020): formal pre is only CurrentLoanRequest exists.
 * Approval is required by listApprovalRequest, not by generateLoanAgreement.
 * Frozen v6 intent said "approved request"; corrected input delta drops that qualifier.
 * Content "Loan Agreement" is in the formal postcondition.
 */
describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/generateLoanAgreement', () => {
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

  it('creates a LoanAgreement with formal content for the current request', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.APPROVED;
    service.CurrentLoanRequest = loanRequest;
    const result = service.generateLoanAgreement();
    expect(result).toBe(true);
    const loanAgreement = getRepository(LoanAgreement)[0];
    expect(loanAgreement.Content).toBe('Loan Agreement');
    expect(loanRequest.AttachedLoanAgreement).toBe(loanAgreement);
    expect(getRepository(LoanAgreement)).toContain(loanAgreement);
  });

  it('succeeds for a non-APPROVED current request (approval is not a precondition)', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    loanRequest.Status = LoanRequestStatus.SUBMITTED;
    service.CurrentLoanRequest = loanRequest;
    const result = service.generateLoanAgreement();
    expect(result).toBe(true);
    expect(getRepository(LoanAgreement)[0].Content).toBe('Loan Agreement');
    expect(loanRequest.AttachedLoanAgreement).toBe(getRepository(LoanAgreement)[0]);
  });

  it('rejects when CurrentLoanRequest is missing', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    expectPreconditionRejected(() => service.generateLoanAgreement());
    expect(getRepository(LoanAgreement)).toHaveLength(0);
  });
});
