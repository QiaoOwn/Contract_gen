import {Book, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByTitle', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book));
  });

  it('Happy Path: returns books matching title', () => {
    const service = new SearchBook();
    const book = new Book();
    book.Title = 'test';
    getRepository(Book).push(book);
    const result = service.searchBookByTitle(book.Title);
    expect(result).toContain(book);
  });

  it('rejects when title is empty', () => {
    const service = new SearchBook();
    const book = new Book();
    book.Title = 'test';
    getRepository(Book).push(book);
    expectPreconditionRejected(() => service.searchBookByTitle(''));
    expect(getRepository(Book)).toHaveLength(1);
  });
});
