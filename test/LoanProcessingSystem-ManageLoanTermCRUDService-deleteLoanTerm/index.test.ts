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

describe('LoanProcessingSystem/ManageLoanTermCRUDService/deleteLoanTerm', () => {
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
    const result = service.deleteLoanTerm(term.ItemID);
    expect(result).toBe(true);
    expect(getRepository(LoanTerm).length).toBe(0);
  });

  it('rejects when referenced entity does not exist', () => {
    const service = new ManageLoanTermCRUDService();
    expectPreconditionRejected(() => service.deleteLoanTerm(99));
  });
});
