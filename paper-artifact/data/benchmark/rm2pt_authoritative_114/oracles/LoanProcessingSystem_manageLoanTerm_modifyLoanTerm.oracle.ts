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

describe('LoanProcessingSystem/ManageLoanTermCRUDService/modifyLoanTerm', () => {
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
    const service = new ManageLoanTermCRUDService();
    const term = new LoanTerm();
    term.ItemID = 1;
    term.Content = '1';
    getRepository(LoanTerm).push(term);
    const result = service.modifyLoanTerm(term.ItemID, 'modifiedContent');
    expect(result).toBe(true);
    expect(term.Content).toBe('modifiedContent');
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageLoanTermCRUDService();
    expectPreconditionRejected(() => service.modifyLoanTerm(99, 'modifiedContent'));
  });
});
