import {Book, BookCopy, getRepository, SearchBook} from './entry';
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookByBarCode', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book), getRepository(BookCopy));
  });

  it('returns every book with a matching copy and excludes other books', () => {
    const service = new SearchBook();
    const unrelated = new Book();
    const unrelatedCopy = new BookCopy();
    unrelatedCopy.Barcode = 'other';
    unrelated.Copys = [unrelatedCopy];
    const first = new Book();
    const firstCopy = new BookCopy();
    firstCopy.Barcode = 'target';
    first.Copys = [firstCopy];
    const second = new Book();
    const secondCopy = new BookCopy();
    secondCopy.Barcode = 'target';
    second.Copys = [secondCopy];
    getRepository(Book).push(unrelated, first, second);
    getRepository(BookCopy).push(unrelatedCopy, firstCopy, secondCopy);

    expectSameMembers(service.searchBookByBarCode('target'), [first, second]);
    expectSameMembers(service.searchBookByBarCode('missing'), []);
  });

  it('rejects when barcode is not a string', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookByBarCode(1 as unknown as string));
  });
});
