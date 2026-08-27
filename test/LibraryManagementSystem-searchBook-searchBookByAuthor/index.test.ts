import {Book, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByAuthor', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book));
  });

  it('Happy Path: returns books matching author', () => {
    const service = new SearchBook();
    const book = new Book();
    book.Author = 'test';
    getRepository(Book).push(book);
    const result = service.searchBookByAuthor(book.Author);
    expect(result).toContain(book);
  });

  it('rejects when author is empty', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookByAuthor(''));
  });
});
