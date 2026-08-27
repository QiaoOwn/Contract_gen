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

describe('LoanProcessingSystem/ManageLoanTermCRUDService/createLoanTerm', () => {
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
    const result = service.createLoanTerm(1, '2');
    expect(result).toBe(true);
    const term = getRepository(LoanTerm)[0];
    expect(term.ItemID).toBe(1);
    expect(term.Content).toBe('2');
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageLoanTermCRUDService();
    const result = service.createLoanTerm(1, '2');
    expect(result).toBe(true);
    const term = getRepository(LoanTerm)[0];
    expect(term.ItemID).toBe(1);
    expect(term.Content).toBe('2');
    const again = new ManageLoanTermCRUDService();
    expectPreconditionRejected(() => again.createLoanTerm(1, '2'));
  });
});
