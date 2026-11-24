import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  ManageLoanTermCRUDService,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/ManageLoanTermCRUDService/queryLoanTerm', () => {
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

  it('returns the loan term with the requested id among multiple records', () => {
    const service = new ManageLoanTermCRUDService();
    const other = new LoanTerm();
    other.ItemID = 17;
    const term = new LoanTerm();
    term.ItemID = 41;
    getRepository(LoanTerm).push(other, term);
    const result = service.queryLoanTerm(term.ItemID);
    expect(result).toBe(term);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageLoanTermCRUDService();
    const other = new LoanTerm();
    other.ItemID = 17;
    getRepository(LoanTerm).push(other);
    expectPreconditionRejected(() => service.queryLoanTerm(99));
  });
});
