import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  EvaluateLoanRequestModule,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EvaluateLoanRequestModule/addLoanTerm', () => {
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

  it('attaches the selected loan term to the current request', () => {
    const service = new EvaluateLoanRequestModule();
    const term = new LoanTerm();
    term.ItemID = 1;
    getRepository(LoanTerm).push(term);
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.AttachedLoanTerms = [];
    expect(service.addLoanTerm(term.ItemID)).toBe(true);
    expect(service.CurrentLoanRequest.AttachedLoanTerms).toContain(term);
  });

  it('rejects when CurrentLoanRequest is missing', () => {
    const service = new EvaluateLoanRequestModule();
    const term = new LoanTerm();
    term.ItemID = 1;
    getRepository(LoanTerm).push(term);
    expectPreconditionRejected(() => service.addLoanTerm(term.ItemID));
  });

  it('rejects when the selected LoanTerm is missing', () => {
    const service = new EvaluateLoanRequestModule();
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.AttachedLoanTerms = [];
    expectPreconditionRejected(() => service.addLoanTerm(99));
    expect(service.CurrentLoanRequest.AttachedLoanTerms).toHaveLength(0);
  });
});
