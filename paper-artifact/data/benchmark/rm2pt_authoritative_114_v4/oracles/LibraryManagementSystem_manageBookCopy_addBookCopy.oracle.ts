import {Book, BookCopy, CopyStatus, ManageBookCopyCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageBookCopyCRUDService/addBookCopy', () => {
  const books = () => getRepository(Book);
  const copies = () => getRepository(BookCopy);
  beforeEach(() => clearRepositories(books(), copies()));

  const book = (callNo: string, count: number) => {
    const owner = Object.assign(new Book(), {CallNo: callNo, CopyNum: count, Copys: [] as BookCopy[]});
    books().push(owner);
    return owner;
  };

  it.each([
    ['ordinary', 'B14', 'shelf 4', 0],
    ['another owner', 'shared', 'rack 19', 11],
    ['', '', '', 3],
  ] as const)('creates and links exactly one copy for %j', (callNo, barcode, location, count) => {
    const neighbor = book('another title', 1);
    const existing = Object.assign(new BookCopy(), {Barcode: barcode === 'shared' ? barcode : 'other', BookBelongs: neighbor});
    neighbor.Copys.push(existing);
    copies().push(existing);
    const owner = book(callNo, count);
    const before = [...copies()];

    expect(new ManageBookCopyCRUDService().addBookCopy(callNo, barcode, location)).toBe(true);
    const created = copies().filter(copy => !before.includes(copy));
    expect(copies()).toHaveLength(before.length + 1);
    expect(created).toHaveLength(1);
    expect(owner.Copys).toContain(created[0]);
    expect(owner.Copys).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(BookCopy);
    expect(created[0].BookBelongs).toBe(owner);
    expect(created[0].Barcode).toBe(barcode);
    expect(created[0].Location).toBe(location);
    expect(created[0].Status).toBe(CopyStatus.AVAILABLE);
    expect(created[0].IsReserved).toBe(false);
    expect(owner.CopyNum).toBe(count + 1);
    expect(copies()).toContain(existing);
  });

  it('rejects a missing Book without adding a copy', () => {
    book('unrelated', 0);
    expectPreconditionRejected(() => new ManageBookCopyCRUDService().addBookCopy('absent', 'b', 'x'));
    expect(copies()).toHaveLength(0);
  });

  it('rejects a barcode already linked to the Book without mutating its copies or count', () => {
    const owner = book('selected', 1);
    const existing = Object.assign(new BookCopy(), {Barcode: 'linked', BookBelongs: owner});
    owner.Copys.push(existing);
    expectPreconditionRejected(() => new ManageBookCopyCRUDService().addBookCopy('selected', 'linked', 'x'));
    expect(owner.Copys).toEqual([existing]);
    expect(owner.CopyNum).toBe(1);
    expect(copies()).toHaveLength(0);
  });
});
