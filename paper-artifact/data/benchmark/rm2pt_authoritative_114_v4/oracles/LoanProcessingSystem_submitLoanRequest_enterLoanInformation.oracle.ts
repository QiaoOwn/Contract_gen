import {LoanRequest, SubmitLoanRequestModule, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

const fields = [
  'RequestID', 'Name', 'LoanAmount', 'LoanPurpose', 'Income', 'PhoneNumber',
  'PostalAddress', 'ZipCode', 'Email', 'WorkReferences', 'CreditReferences',
  'CheckingAccountNumber', 'SecurityNumber',
] as const;
const values = [
  173, 'Alice', 5100.75, 'Equipment', 8400.25, 15400001, 'Main Street', 50311,
  'alice@example.org', 'Employer One', 'Bank Two', 20731, 87019,
] as const;

describe('LoanProcessingSystem/SubmitLoanRequestModule/enterLoanInformation', () => {
  beforeEach(() => {
    getRepository(LoanRequest).splice(0);
  });

  it('creates exactly one new request with all thirteen fields, preserves the neighbor, and selects it', () => {
    const service = new SubmitLoanRequestModule();
    const existing = Object.assign(new LoanRequest(), {
      RequestID: 999, Name: 'Neighbor', LoanAmount: 1, Income: 2,
    });
    getRepository(LoanRequest).push(existing);
    service.CurrentLoanRequest = existing;
    const before = [...getRepository(LoanRequest)];
    expect(service.enterLoanInformation(...values)).toBe(true);
    const repo = getRepository(LoanRequest);
    const created = repo.filter(request => !before.includes(request));
    expect(repo).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(repo).toEqual(expect.arrayContaining([existing, created[0]]));
    expect(existing.RequestID).toBe(999);
    expect(existing.Name).toBe('Neighbor');
    expect(existing.LoanAmount).toBe(1);
    expect(existing.Income).toBe(2);
    fields.forEach((field, i) => expect(created[0][field]).toBe(values[i]));
    expect(service.CurrentLoanRequest).toBe(created[0]);
  });

  it('rejects a duplicate identifier without creating another request or changing the current request', () => {
    const service = new SubmitLoanRequestModule();
    const existing = Object.assign(new LoanRequest(), {
      RequestID: 173, Name: 'Original', LoanAmount: 99, Income: 88,
    });
    const current = Object.assign(new LoanRequest(), {RequestID: 44, Name: 'Current'});
    getRepository(LoanRequest).push(existing);
    service.CurrentLoanRequest = current;
    expectPreconditionRejected(() => service.enterLoanInformation(...values));
    expect(getRepository(LoanRequest)).toEqual([existing]);
    expect(existing.RequestID).toBe(173);
    expect(existing.Name).toBe('Original');
    expect(existing.LoanAmount).toBe(99);
    expect(existing.Income).toBe(88);
    expect(service.CurrentLoanRequest).toBe(current);
    expect(current.RequestID).toBe(44);
    expect(current.Name).toBe('Current');
  });
});
