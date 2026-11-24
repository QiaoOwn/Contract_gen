import {LoanTerm, ManageLoanTermCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/ManageLoanTermCRUDService/deleteLoanTerm', () => {
  beforeEach(() => clearRepositories(getRepository(LoanTerm)));

  it('removes the selected LoanTerm, preserves its neighbor identity, and returns true', () => {
    const target = Object.assign(new LoanTerm(), {ItemID: 41, Content: 'target'});
    const neighbor = Object.assign(new LoanTerm(), {ItemID: 17, Content: 'neighbor-content'});
    getRepository(LoanTerm).push(neighbor, target);
    expect(new ManageLoanTermCRUDService().deleteLoanTerm(41)).toBe(true);
    expect(getRepository(LoanTerm)).toEqual([neighbor]);
    expect(neighbor.ItemID).toBe(17);
    expect(neighbor.Content).toBe('neighbor-content');
  });

  it('rejects a missing ID without removing another LoanTerm', () => {
    const neighbor = Object.assign(new LoanTerm(), {ItemID: 17, Content: 'neighbor-content'});
    getRepository(LoanTerm).push(neighbor);
    expectPreconditionRejected(() => new ManageLoanTermCRUDService().deleteLoanTerm(99));
    expect(getRepository(LoanTerm)).toEqual([neighbor]);
  });
});
