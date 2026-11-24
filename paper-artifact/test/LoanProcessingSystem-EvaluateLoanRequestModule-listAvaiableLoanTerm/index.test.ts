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

  it('returns every LoanTerm record', () => {
    const service = new EvaluateLoanRequestModule();
    const first = new LoanTerm();
    const second = new LoanTerm();
    getRepository(LoanTerm).push(first, second);
    expectSameMembers(service.listAvaiableLoanTerm(), [first, second]);
  });

  it('returns an empty collection when no terms are registered', () => {
    const service = new EvaluateLoanRequestModule();
    expectSameMembers(service.listAvaiableLoanTerm(), []);
  });
});
