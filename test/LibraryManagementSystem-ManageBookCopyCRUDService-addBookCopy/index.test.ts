import {
  Administrator,
  Book,
  BookCopy,
  CopyStatus,
  Faculty,
  Librarian,
  Loan,
  ManageBookCopyCRUDService,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageBookCopyCRUDService/addBookCopy', () => {
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
    const service = new ManageBookCopyCRUDService();
    const book = new Book();
    book.CallNo = '1';
    book.Copys = [];
    book.CopyNum = 1;
    getRepository(Book).push(book);
    const result = service.addBookCopy('1', '2', '3');
    expect(result).toBe(true);
    const bookCopy = getRepository(BookCopy)[0];
    expect(bookCopy).toBeDefined();
    expect(bookCopy.Barcode).toBe('2');
    expect(bookCopy.Status).toBe(CopyStatus.AVAILABLE);
    expect(bookCopy.Location).toBe('3');
    expect(bookCopy.IsReserved).toBe(false);
    expect(bookCopy.BookBelongs).toBe(book);
    expect(book.CopyNum).toBe(2);
  });

  it('rejects when identifier is already used', () => {
    const service = new ManageBookCopyCRUDService();
    const book = new Book();
    book.CallNo = '1';
    book.Copys = [];
    book.CopyNum = 1;
    getRepository(Book).push(book);
    const result = service.addBookCopy('1', '2', '3');
    expect(result).toBe(true);
    const bookCopy = getRepository(BookCopy)[0];
    expect(bookCopy).toBeDefined();
    expect(bookCopy.Barcode).toBe('2');
    expect(bookCopy.Status).toBe(CopyStatus.AVAILABLE);
    expect(bookCopy.Location).toBe('3');
    expect(bookCopy.IsReserved).toBe(false);
    expect(bookCopy.BookBelongs).toBe(book);
    expect(book.CopyNum).toBe(2);
    const again = new ManageBookCopyCRUDService();
    expectPreconditionRejected(() => again.addBookCopy('1', '2', '3'));
  });
});
