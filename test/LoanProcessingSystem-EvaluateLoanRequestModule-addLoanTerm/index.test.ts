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

  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const term = new LoanTerm();
    term.ItemID = 1;
    getRepository(LoanTerm).push(term);
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.AttachedLoanTerms = [];
    const result = service.addLoanTerm(term.ItemID);
    expect(result).toBe(true);
    expect(service.CurrentLoanRequest.AttachedLoanTerms).toContain(term);
  });

  it('rejects when identifier is already used', () => {
    const service = new EvaluateLoanRequestModule();
    const term = new LoanTerm();
    term.ItemID = 1;
    getRepository(LoanTerm).push(term);
    service.CurrentLoanRequest = new LoanRequest();
    service.CurrentLoanRequest.AttachedLoanTerms = [];
    const result = service.addLoanTerm(term.ItemID);
    expect(result).toBe(true);
    expect(service.CurrentLoanRequest.AttachedLoanTerms).toContain(term);
    const again = new EvaluateLoanRequestModule();
    expectPreconditionRejected(() => again.addLoanTerm(term.ItemID));
  });
});
