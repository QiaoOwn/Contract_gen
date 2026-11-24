import {Book, SearchBook, getRepository} from './entry';
import {expectSameMembers, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned exact ISBN search with model spelling ISBn', () => {
  beforeEach(() => getRepository(Book).splice(0));
  const cases = [
    {name: 'empty catalog', value: 'ISBN-860', identifiers: [] as string[], indices: [] as number[]},
    {name: 'absent ISBN', value: 'ISBN-860', identifiers: ['ISBN-120', 'ISBN-440'], indices: []},
    {name: 'nonfirst ISBN', value: 'ISBN-860', identifiers: ['ISBN-120', 'ISBN-440', 'ISBN-860'], indices: [2]},
    {name: 'all matches', value: 'ISBN-860', identifiers: ['ISBN-860', 'ISBN-120', 'ISBN-860'], indices: [0, 2]},
    {name: 'equal-valued distinct books', value: 'ISBN-860', identifiers: ['ISBN-860', 'ISBN-860'], indices: [0, 1]},
    {name: 'case-sensitive ISBN', value: 'ISBN-860', identifiers: ['isbn-860', 'ISBN-860'], indices: [1]},
    {name: 'not a substring query', value: 'ISBN-860', identifiers: ['ISBN-860-extra', 'prefixISBN-860', 'ISBN-860'], indices: [2]},
    {name: 'spaces retained', value: ' ISBN-860 ', identifiers: ['ISBN-860', ' ISBN-860 '], indices: [1]},
    {name: 'empty String is admissible', value: '', identifiers: ['ISBN-120', ''], indices: [1]},
  ];
  it.each(cases)('$name', ({value, identifiers, indices}) => {
    const books = identifiers.map(ISBn => Object.assign(new Book(), {CallNo: 'same', ISBn, Title: 'Other title', Author: 'Other author'}));
    getRepository(Book).push(...books);
    expectSameMembers(new SearchBook().searchBookByISBN(value), indices.map(index => books[index]));
  });
  it('rejects a non-String ISBN', () => expectPreconditionRejected(() => new SearchBook().searchBookByISBN(860 as unknown as string)));
});
