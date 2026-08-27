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

  it('Happy Path', () => {
    const service = new ThirdPartyServices();
    const result = service.sendNotificationEmail('a');
    expect(result).toBe(true);
  });

  it('rejects when precondition is violated', () => {
    const service = new ThirdPartyServices();
    expectPreconditionRejected(() => service.sendNotificationEmail(''));
  });
});
