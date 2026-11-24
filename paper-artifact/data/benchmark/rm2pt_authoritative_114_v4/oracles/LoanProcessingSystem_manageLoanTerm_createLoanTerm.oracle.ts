import {LoanTerm, ManageLoanTermCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/ManageLoanTermCRUDService/createLoanTerm', () => {
  beforeEach(() => clearRepositories(getRepository(LoanTerm)));

  it('creates exactly one stored LoanTerm with the supplied ID and content', () => {
    const result = new ManageLoanTermCRUDService().createLoanTerm(1, '2');
    const stored = getRepository(LoanTerm);
    expect(result).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toBeInstanceOf(LoanTerm);
    expect(stored[0].ItemID).toBe(1);
    expect(stored[0].Content).toBe('2');
  });

  it('rejects a duplicate identifier without creating or replacing a LoanTerm', () => {
    const existing = Object.assign(new LoanTerm(), {ItemID: 1});
    getRepository(LoanTerm).push(existing);
    expectPreconditionRejected(() => new ManageLoanTermCRUDService().createLoanTerm(1, '2'));
    expect(getRepository(LoanTerm)).toEqual([existing]);
  });
});
