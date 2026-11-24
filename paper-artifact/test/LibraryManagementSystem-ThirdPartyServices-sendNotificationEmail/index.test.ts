import {
  Administrator,
  Book,
  BookCopy,
  Faculty,
  Librarian,
  Loan,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  ThirdPartyServices,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

/**
 * TOSEM adjudication (INT-FID-007): formal project OCL `email <> ""` is authoritative.
 * Upstream RM2Doc prose says "not null"; upstream formal OCL and frozen v6 precondition
 * already use non-empty. Prose "null" is a non-authoritative paraphrase — do not reject null.
 */
describe('LibraryManagementSystem/ThirdPartyServices/sendNotificationEmail', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(Administrator),
      getRepository(Book),
      getRepository(BookCopy),
      getRepository(Faculty),
      getRepository(Librarian),
      getRepository(Loan),
      getRepository(RecommendBook),
      getRepository(Reserve),
      getRepository(Student),
      getRepository(Subject),
      getRepository(User)
    );
  });

  it('Happy Path: non-empty email returns true', () => {
    const service = new ThirdPartyServices();
    expect(service.sendNotificationEmail('a')).toBe(true);
  });

  it('accepts whitespace-only email because the contract is only email <> ""', () => {
    const service = new ThirdPartyServices();
    expect(service.sendNotificationEmail(' ')).toBe(true);
  });

  it('rejects when email is the empty string', () => {
    const service = new ThirdPartyServices();
    expectPreconditionRejected(() => service.sendNotificationEmail(''));
  });
});
