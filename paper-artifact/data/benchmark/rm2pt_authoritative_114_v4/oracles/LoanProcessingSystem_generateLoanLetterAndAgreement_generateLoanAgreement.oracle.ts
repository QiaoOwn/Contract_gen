import {LoanRequest, LoanAgreement, GenerateLoanLetterAndAgreementModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/generateLoanAgreement', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
    getRepository(LoanAgreement).splice(0);
  });

  it('creates exactly one agreement for the current request and leaves a neighbor unlinked', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const neighbor = Object.assign(new LoanRequest(), {RequestID: 11});
    const current = Object.assign(new LoanRequest(), {RequestID: 22});
    getRepository(LoanRequest).push(neighbor, current);
    service.CurrentLoanRequest = current;
    const beforeAgreements = [...getRepository(LoanAgreement)];
    expect(service.generateLoanAgreement()).toBe(true);
    const agreements = getRepository(LoanAgreement);
    const created = agreements.filter(item => !beforeAgreements.includes(item));
    expect(agreements).toHaveLength(1);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(LoanAgreement);
    expect(created[0].Content).toBe('Loan Agreement');
    expect(current.AttachedLoanAgreement).toBe(created[0]);
    expect(neighbor.AttachedLoanAgreement).toBeUndefined();
    expect(service.CurrentLoanRequest).toBe(current);
    expect(getRepository(LoanRequest)).toEqual([neighbor, current]);
  });

  it('rejects without a current request and creates nothing despite a neighbor existing', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const neighbor = Object.assign(new LoanRequest(), {RequestID: 11});
    getRepository(LoanRequest).push(neighbor);
    expectPreconditionRejected(() => service.generateLoanAgreement());
    expect(getRepository(LoanAgreement)).toHaveLength(0);
    expect(neighbor.AttachedLoanAgreement).toBeUndefined();
    expect(getRepository(LoanRequest)).toEqual([neighbor]);
  });
});
