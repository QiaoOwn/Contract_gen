import {Book, BookCopy, CopyStatus, ManageBookCopyCRUDService, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('addBookCopy: book-scoped identity and copy count', () => {
  const books = () => getRepository(Book), store = () => getRepository(BookCopy);
  beforeEach(() => {books().splice(0); store().splice(0);});
  function book(callNo: string, count: number) {
    const b = Object.assign(new Book(), {CallNo: callNo, CopyNum: count, Copys: [] as BookCopy[]});
    books().push(b); return b;
  }
  test.each([
    ['ordinary', 'B14', 'shelf 4', 0],
    ['another owner', 'shared', 'rack 19', 11],
    ['', '', '', 3],
  ] as const)('adds one copy to %j', (callNo, barcode, location, count) => {
    const neighbor = book('another title', 1);
    const existing = Object.assign(new BookCopy(), {Barcode: barcode === 'shared' ? barcode : 'some other code', BookBelongs: neighbor});
    neighbor.Copys.push(existing); store().push(existing);
    const owner = book(callNo, count), before = new Set(store());
    expect(new ManageBookCopyCRUDService().addBookCopy(callNo, barcode, location)).toBe(true);
    expect(owner.CopyNum).toBe(count + 1);
    expect(store().some(copy => copy instanceof BookCopy && !before.has(copy) && owner.Copys.includes(copy) &&
      copy.BookBelongs === owner && copy.Barcode === barcode && copy.Location === location &&
      copy.Status === CopyStatus.AVAILABLE && copy.IsReserved === false)).toBe(true);
  });
  test('rejects a missing book', () => {
    book('unrelated', 0);
    expectPreconditionRejected(() => new ManageBookCopyCRUDService().addBookCopy('absent', 'b', 'x'));
  });
  test('rejects a barcode already in the selected association even without a repository entry', () => {
    const owner = book('selected', 1);
    owner.Copys.push(Object.assign(new BookCopy(), {Barcode: 'linked', BookBelongs: owner}));
    expectPreconditionRejected(() => new ManageBookCopyCRUDService().addBookCopy('selected', 'linked', 'x'));
  });
});
