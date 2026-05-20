import {EvaluateLoanRequestModule, getRepository, LoanTerm} from './entry';
describe('LoanProcessingSystem/EvaluateLoanRequestModule/listAvaiableLoanTerm', () => {
  it('Happy Path', () => {
    const service = new EvaluateLoanRequestModule();
    const result = service.listAvaiableLoanTerm();
    expect(result).toBe(getRepository(LoanTerm));
  });
});
