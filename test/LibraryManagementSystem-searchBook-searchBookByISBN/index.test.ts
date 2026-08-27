import {Book, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByISBN', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book));
  });

  it('Happy Path: returns books matching ISBN', () => {
    const service = new SearchBook();
    const book = new Book();
    book.ISBn = 'test';
    getRepository(Book).push(book);
    const result = service.searchBookByISBN(book.ISBn);
    expect(result).toContain(book);
  });

  it('rejects when ISBN is not a string', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookByISBN(1 as unknown as string));
  });
});
