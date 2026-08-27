import {
  Administrator,
  Book,
  BookCopy,
  Faculty,
  Librarian,
  Loan,
  ManageSubjectCRUDService,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageSubjectCRUDService/createSubject', () => {
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
    const service = new ManageSubjectCRUDService();
    const result = service.createSubject('1');
    expect(result).toBe(true);
    const subject = getRepository(Subject)[0];
    expect(subject.Name).toBe('1');
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageSubjectCRUDService();
    const result = service.createSubject('1');
    expect(result).toBe(true);
    const subject = getRepository(Subject)[0];
    expect(subject.Name).toBe('1');
    const again = new ManageSubjectCRUDService();
    expectPreconditionRejected(() => again.createSubject('1'));
  });
});
