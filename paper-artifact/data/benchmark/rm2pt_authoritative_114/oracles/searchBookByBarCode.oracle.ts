import {Book, BookCopy, SearchBook, getRepository} from './entry';
import {expectSameMembers, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned barcode search through Book copies', () => {
  beforeEach(() => {getRepository(Book).splice(0); getRepository(BookCopy).splice(0);});
  const cases = [
    {name: 'empty catalog', value: 'B-721', copies: [] as string[][], indices: [] as number[]},
    {name: 'absent barcode', value: 'B-721', copies: [['B-880'], []], indices: []},
    {name: 'match after books without matching copies', value: 'B-721', copies: [[], ['B-880'], ['B-721']], indices: [2]},
    {name: 'multiple books and duplicate-valued copies', value: 'B-721', copies: [['B-721', 'B-721'], ['B-880'], ['B-721']], indices: [0, 2]},
    {name: 'distinct books with identical attributes', value: 'B-721', copies: [['B-721'], ['B-721']], indices: [0, 1]},
    {name: 'case-sensitive barcode', value: 'B-721', copies: [['b-721'], ['B-721']], indices: [1]},
    {name: 'exact barcode rather than substring', value: 'B-721', copies: [['B-721-extra'], ['prefixB-721'], ['B-721']], indices: [2]},
    {name: 'spaces retained', value: ' B-721 ', copies: [['B-721'], [' B-721 ']], indices: [1]},
    {name: 'empty String is admissible', value: '', copies: [['B-880'], ['']], indices: [1]},
  ];
  it.each(cases)('$name', ({value, copies, indices}) => {
    const books = copies.map(values => Object.assign(new Book(), {CallNo: 'same', Title: 'same', Author: 'same', ISBn: 'same',
      Copys: values.map(Barcode => Object.assign(new BookCopy(), {Barcode}))}));
    getRepository(Book).push(...books);
    // Linked copies deliberately have no independent repository membership.
    expectSameMembers(new SearchBook().searchBookByBarCode(value), indices.map(index => books[index]));
  });
  it('rejects a non-String barcode', () => {
    expectPreconditionRejected(() => new SearchBook().searchBookByBarCode(721 as unknown as string));
  });
});
