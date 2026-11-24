import {LoanTerm, EvaluateLoanRequestModule, getRepository} from './entry';
import {expectSameMembers} from '../helpers/contractOracle';

describe('listAvaiableLoanTerm source boundaries', () => {
  beforeEach(() => { getRepository(LoanTerm).splice(0); });
  it('returns every LoanTerm instance by identity', () => {
    const service = new EvaluateLoanRequestModule();
    const terms = Array.from({length: 13}, (_, i) => Object.assign(new LoanTerm(), {ItemID: i + 1}));
    getRepository(LoanTerm).push(...terms);
    expectSameMembers(service.listAvaiableLoanTerm(), terms);
  });
  it('returns a defined empty set without requiring a term', () => {
    expectSameMembers(new EvaluateLoanRequestModule().listAvaiableLoanTerm(), []);
  });
});
