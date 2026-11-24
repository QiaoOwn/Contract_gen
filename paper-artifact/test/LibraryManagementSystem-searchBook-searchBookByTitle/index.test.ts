import {Book, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByTitle', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book));
  });

  it('returns every matching title and excludes other books', () => {
    const service = new SearchBook();
    const unrelated = new Book();
    unrelated.Title = 'other';
    const first = new Book();
    first.Title = 'target';
    const second = new Book();
    second.Title = 'target';
    getRepository(Book).push(unrelated, first, second);

    expectSameMembers(service.searchBookByTitle('target'), [first, second]);
    expectSameMembers(service.searchBookByTitle('missing'), []);
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
