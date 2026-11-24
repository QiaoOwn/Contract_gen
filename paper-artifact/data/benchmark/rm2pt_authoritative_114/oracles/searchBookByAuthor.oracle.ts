import {Book, SearchBook, getRepository} from './entry';
import {expectSameMembers, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned exact author search', () => {
  beforeEach(() => getRepository(Book).splice(0));
  const cases = [
    {name: 'empty catalog', value: 'Rivers', authors: [] as string[], indices: [] as number[]},
    {name: 'absent author', value: 'Rivers', authors: ['Baker', 'Chen'], indices: []},
    {name: 'nonfirst author', value: 'Rivers', authors: ['Baker', 'Chen', 'Rivers'], indices: [2]},
    {name: 'all matches', value: 'Rivers', authors: ['Rivers', 'Chen', 'Rivers'], indices: [0, 2]},
    {name: 'equal-valued distinct books', value: 'Rivers', authors: ['Rivers', 'Rivers'], indices: [0, 1]},
    {name: 'case-sensitive author', value: 'Rivers', authors: ['rivers', 'Rivers', 'RIVERS'], indices: [1]},
    {name: 'not a substring query', value: 'Rivers', authors: ['Rivers Jr', 'A Rivers', 'Rivers'], indices: [2]},
    {name: 'whitespace author is not empty', value: '   ', authors: [' ', '   ', 'Rivers'], indices: [1]},
  ];
  it.each(cases)('$name', ({value, authors, indices}) => {
    const books = authors.map(Author => Object.assign(new Book(), {CallNo: 'same', Author, Title: 'Other title', ISBn: 'Other ISBN'}));
    getRepository(Book).push(...books);
    expectSameMembers(new SearchBook().searchBookByAuthor(value), indices.map(index => books[index]));
  });
  it('rejects an empty author name', () => expectPreconditionRejected(() => new SearchBook().searchBookByAuthor('')));
});
