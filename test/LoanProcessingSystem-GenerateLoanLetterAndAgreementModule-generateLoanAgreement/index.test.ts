import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  GenerateLoanLetterAndAgreementModule,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

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

  it('Happy Path', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const loanRequest = new LoanRequest();
    service.CurrentLoanRequest = loanRequest;
    const result = service.generateLoanAgreement();
    expect(result).toBe(true);
    const loanAgreement = getRepository(LoanAgreement)[0];
    expect(loanAgreement.Content).toBe('Loan Agreement');
    expect(loanRequest.AttachedLoanAgreement).toBe(loanAgreement);
  });

  it('rejects when precondition is violated', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    expectPreconditionRejected(() => service.generateLoanAgreement());
  });
});
