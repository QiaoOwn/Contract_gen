import {
  Administrator,
  Book,
  BookCopy,
  Faculty,
  Librarian,
  Loan,
  ManageLibrarianCRUDService,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageLibrarianCRUDService/createLibrarian', () => {
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
    const service = new ManageLibrarianCRUDService();
    const result = service.createLibrarian('1', '2', '3');
    expect(result).toBe(true);
    const librarian = getRepository(Librarian)[0];
    expect(librarian.LibrarianID).toBe('1');
    expect(librarian.Name).toBe('2');
    expect(librarian.Password).toBe('3');
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageLibrarianCRUDService();
    const result = service.createLibrarian('1', '2', '3');
    expect(result).toBe(true);
    const librarian = getRepository(Librarian)[0];
    expect(librarian.LibrarianID).toBe('1');
    expect(librarian.Name).toBe('2');
    expect(librarian.Password).toBe('3');
    const again = new ManageLibrarianCRUDService();
    expectPreconditionRejected(() => again.createLibrarian('1', '2', '3'));
  });
});
