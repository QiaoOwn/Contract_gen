import {Book, SearchBook, getRepository} from './entry';
import {expectSameMembers, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned exact title search', () => {
  beforeEach(() => getRepository(Book).splice(0));
  const cases = [
    {name: 'empty catalog', value: 'Atlas', titles: [] as string[], indices: [] as number[]},
    {name: 'absent title', value: 'Atlas', titles: ['Map', 'Guide'], indices: []},
    {name: 'nonfirst title', value: 'Atlas', titles: ['Map', 'Guide', 'Atlas'], indices: [2]},
    {name: 'all matches', value: 'Atlas', titles: ['Atlas', 'Map', 'Atlas'], indices: [0, 2]},
    {name: 'distinct equal-valued books', value: 'Atlas', titles: ['Atlas', 'Atlas'], indices: [0, 1]},
    {name: 'case-sensitive title', value: 'Atlas', titles: ['atlas', 'Atlas', 'ATLAS'], indices: [1]},
    {name: 'not a substring query', value: 'Atlas', titles: ['Atlas Volume 2', 'World Atlas', 'Atlas'], indices: [2]},
    {name: 'whitespace-only title remains nonempty', value: '  ', titles: [' ', '  ', 'Atlas'], indices: [1]},
  ];
  it.each(cases)('$name', ({value, titles, indices}) => {
    const books = titles.map(Title => Object.assign(new Book(), {CallNo: 'same', Title, Author: 'Other author', ISBn: 'Other ISBN'}));
    getRepository(Book).push(...books);
    expectSameMembers(new SearchBook().searchBookByTitle(value), indices.map(index => books[index]));
  });
  it('rejects an empty title', () => expectPreconditionRejected(() => new SearchBook().searchBookByTitle('')));
});
