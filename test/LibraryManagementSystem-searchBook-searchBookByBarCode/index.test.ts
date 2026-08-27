import {Book, BookCopy, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByBarCode', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book), getRepository(BookCopy));
  });

  it('Happy Path: returns books matching barcode', () => {
    const service = new SearchBook();
    const book = new Book();
    const copy = new BookCopy();
    copy.Barcode = '1';
    book.Copys = [copy];
    getRepository(Book).push(book);
    getRepository(BookCopy).push(copy);
    const result = service.searchBookByBarCode(copy.Barcode);
    expect(result).toContain(book);
  });

  it('rejects when barcode is not a string', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookByBarCode(1 as unknown as string));
  });
});
