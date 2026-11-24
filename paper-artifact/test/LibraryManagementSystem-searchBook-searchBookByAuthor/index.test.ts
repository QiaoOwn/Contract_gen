import {Book, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByAuthor', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book));
  });

  it('returns every matching author and excludes other books', () => {
    const service = new SearchBook();
    const unrelated = new Book();
    unrelated.Author = 'other';
    const first = new Book();
    first.Author = 'target';
    const second = new Book();
    second.Author = 'target';
    getRepository(Book).push(unrelated, first, second);

    expectSameMembers(service.searchBookByAuthor('target'), [first, second]);
    expectSameMembers(service.searchBookByAuthor('missing'), []);
  });

  it('rejects when author is empty', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookByAuthor(''));
  });
});
