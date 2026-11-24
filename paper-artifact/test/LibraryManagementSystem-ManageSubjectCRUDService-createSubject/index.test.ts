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

  it('creates a subject with the supplied name and returns true', () => {
    const service = new ManageSubjectCRUDService();
    expect(service.createSubject('databases')).toBe(true);
    const subject = getRepository(Subject)[0];
    expect(subject.Name).toBe('databases');
    expect(getRepository(Subject)).toContain(subject);
  });

  it('rejects when a subject with the same name already exists', () => {
    const service = new ManageSubjectCRUDService();
    expect(service.createSubject('databases')).toBe(true);
    expectPreconditionRejected(() => service.createSubject('databases'));
    expect(getRepository(Subject)).toHaveLength(1);
  });
});
