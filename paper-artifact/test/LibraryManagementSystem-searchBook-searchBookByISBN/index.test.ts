import {Book, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByISBN', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book));
  });

  it('returns every matching ISBN and excludes other books', () => {
    const service = new SearchBook();
    const unrelated = new Book();
    unrelated.ISBn = 'other';
    const first = new Book();
    first.ISBn = 'target';
    const second = new Book();
    second.ISBn = 'target';
    getRepository(Book).push(unrelated, first, second);

    expectSameMembers(service.searchBookByISBN('target'), [first, second]);
    expectSameMembers(service.searchBookByISBN('missing'), []);
  });

  it('rejects when ISBN is not a string', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookByISBN(1 as unknown as string));
  });
});
