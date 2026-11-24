import {LoanRequest, ApprovalLetter, GenerateLoanLetterAndAgreementModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/GenerateLoanLetterAndAgreementModule/genereateApprovalLetter', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
    getRepository(ApprovalLetter).splice(0);
  });

  it('creates exactly one letter for the ID-selected request and leaves a neighbor unlinked', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const neighbor = Object.assign(new LoanRequest(), {RequestID: 11});
    const target = Object.assign(new LoanRequest(), {RequestID: 22});
    getRepository(LoanRequest).push(neighbor, target);
    service.CurrentLoanRequest = neighbor;
    const beforeLetters = [...getRepository(ApprovalLetter)];
    expect(service.genereateApprovalLetter(22)).toBe(true);
    const letters = getRepository(ApprovalLetter);
    const created = letters.filter(item => !beforeLetters.includes(item));
    expect(letters).toHaveLength(1);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(ApprovalLetter);
    expect(created[0].Content).toBe('ApprovalLetterContent');
    expect(target.AttachedApprovalLetter).toBe(created[0]);
    expect(neighbor.AttachedApprovalLetter).toBeUndefined();
    expect(service.CurrentLoanRequest).toBe(target);
    expect(getRepository(LoanRequest)).toEqual([neighbor, target]);
  });

  it('rejects an unknown ID without creating a letter or changing a neighbor', () => {
    const service = new GenerateLoanLetterAndAgreementModule();
    const neighbor = Object.assign(new LoanRequest(), {RequestID: 11});
    getRepository(LoanRequest).push(neighbor);
    service.CurrentLoanRequest = neighbor;
    expectPreconditionRejected(() => service.genereateApprovalLetter(99));
    expect(getRepository(ApprovalLetter)).toHaveLength(0);
    expect(neighbor.AttachedApprovalLetter).toBeUndefined();
    expect(service.CurrentLoanRequest).toBe(neighbor);
    expect(getRepository(LoanRequest)).toEqual([neighbor]);
  });
});
