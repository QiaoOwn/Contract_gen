import {expectSameMembers} from '../helpers/setOracle';
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
import {clearRepositories} from '../helpers/contractOracle';

// Vacuous precondition (true): rejection case not required by test/ORACLE.md.
describe('LoanProcessingSystem/EvaluateLoanRequestModule/listAvaiableLoanTerm', () => {
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
    const result = service.listAvaiableLoanTerm();
    expectSameMembers(result, []);
  });

  it('returns all registered loan terms irrespective of array representation', () => {
    const service = new EvaluateLoanRequestModule();
    const first = new LoanTerm();
    const second = new LoanTerm();
    const terms = getRepository(LoanTerm);
    terms.push(first, second);

    const result = service.listAvaiableLoanTerm();

    expectSameMembers(result, [first, second]);
  });
});
