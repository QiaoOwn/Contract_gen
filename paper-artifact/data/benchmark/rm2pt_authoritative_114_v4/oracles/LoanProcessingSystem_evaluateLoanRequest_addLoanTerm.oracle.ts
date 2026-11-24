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
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/EvaluateLoanRequestModule/addLoanTerm', () => {
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

  it('attaches the selected loan term to the current request without changing a neighbor', () => {
    const service = new EvaluateLoanRequestModule();
    const prior = Object.assign(new LoanTerm(), {ItemID: 7});
    const selected = Object.assign(new LoanTerm(), {ItemID: 1});
    const unused = Object.assign(new LoanTerm(), {ItemID: 9});
    getRepository(LoanTerm).push(prior, selected, unused);
    const neighbor = Object.assign(new LoanRequest(), {
      RequestID: 11,
      AttachedLoanTerms: [prior] as LoanTerm[],
    });
    const current = Object.assign(new LoanRequest(), {
      RequestID: 22,
      AttachedLoanTerms: [prior] as LoanTerm[],
    });
    getRepository(LoanRequest).push(neighbor, current);
    service.CurrentLoanRequest = current;
    expect(service.addLoanTerm(selected.ItemID)).toBe(true);
    expect(current.AttachedLoanTerms).toContain(selected);
    expect(current.AttachedLoanTerms).toContain(prior);
    expect(current.AttachedLoanTerms).not.toContain(unused);
    expect(neighbor.AttachedLoanTerms).toEqual([prior]);
    expect(neighbor.AttachedLoanTerms).not.toContain(selected);
    expect(getRepository(LoanRequest)).toEqual([neighbor, current]);
    expect(getRepository(LoanTerm)).toEqual([prior, selected, unused]);
  });

  it('rejects when CurrentLoanRequest is missing', () => {
    const service = new EvaluateLoanRequestModule();
    const term = Object.assign(new LoanTerm(), {ItemID: 1});
    getRepository(LoanTerm).push(term);
    const other = Object.assign(new LoanRequest(), {
      RequestID: 11,
      AttachedLoanTerms: [] as LoanTerm[],
    });
    getRepository(LoanRequest).push(other);
    expectPreconditionRejected(() => service.addLoanTerm(term.ItemID));
    expect(other.AttachedLoanTerms).toEqual([]);
  });

  it('rejects when the selected LoanTerm is missing', () => {
    const service = new EvaluateLoanRequestModule();
    const existing = Object.assign(new LoanTerm(), {ItemID: 1});
    getRepository(LoanTerm).push(existing);
    const neighbor = Object.assign(new LoanRequest(), {
      RequestID: 11,
      AttachedLoanTerms: [existing] as LoanTerm[],
    });
    const current = Object.assign(new LoanRequest(), {
      RequestID: 22,
      AttachedLoanTerms: [] as LoanTerm[],
    });
    getRepository(LoanRequest).push(neighbor, current);
    service.CurrentLoanRequest = current;
    expectPreconditionRejected(() => service.addLoanTerm(99));
    expect(current.AttachedLoanTerms).toHaveLength(0);
    expect(neighbor.AttachedLoanTerms).toEqual([existing]);
  });
});
