import {LoanTerm, ManageLoanTermCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/ManageLoanTermCRUDService/modifyLoanTerm', () => {
  beforeEach(() => clearRepositories(getRepository(LoanTerm)));

  it('updates only the selected LoanTerm ItemID/Content and returns true', () => {
    const target = Object.assign(new LoanTerm(), {ItemID: 41, Content: 'old-target'});
    const neighbor = Object.assign(new LoanTerm(), {ItemID: 17, Content: 'neighbor-content'});
    getRepository(LoanTerm).push(neighbor, target);
    expect(new ManageLoanTermCRUDService().modifyLoanTerm(41, 'modifiedContent')).toBe(true);
    expect(getRepository(LoanTerm)).toEqual([neighbor, target]);
    expect(target.ItemID).toBe(41);
    expect(target.Content).toBe('modifiedContent');
    expect(neighbor.ItemID).toBe(17);
    expect(neighbor.Content).toBe('neighbor-content');
  });

  it('rejects a missing ID without changing another LoanTerm', () => {
    const neighbor = Object.assign(new LoanTerm(), {ItemID: 17, Content: 'neighbor-content'});
    getRepository(LoanTerm).push(neighbor);
    expectPreconditionRejected(() =>
      new ManageLoanTermCRUDService().modifyLoanTerm(99, 'modifiedContent')
    );
    expect(getRepository(LoanTerm)).toEqual([neighbor]);
    expect(neighbor.ItemID).toBe(17);
    expect(neighbor.Content).toBe('neighbor-content');
  });
});
