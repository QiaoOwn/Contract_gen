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

describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/genereateApprovalLetter', () => {
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
    loanRequest.RequestID = 1;
    getRepository(LoanRequest).push(loanRequest);
    const result = service.genereateApprovalLetter(loanRequest.RequestID);
    expect(result).toBe(true);
    const approvalLetter = getRepository(ApprovalLetter)[0];
    expect(result).toBe(true);
    expect(approvalLetter.Content).toBe('ApprovalLetterContent');
    expect(loanRequest.AttachedApprovalLetter).toBe(approvalLetter);
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });

  it('rejects when precondition is violated', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    expectPreconditionRejected(() => service.genereateApprovalLetter(99));
  });
});
