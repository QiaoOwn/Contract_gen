import {Book, ManageBookCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageBookCRUDService/createBook', () => {
  beforeEach(() => clearRepositories(getRepository(Book)));

  it('creates exactly one stored Book with every supplied field and returns true', () => {
    const before = [...getRepository(Book)];
    const result = new ManageBookCRUDService().createBook('1', '2', '3', '4', '5', '6', '7', 8);
    const stored = getRepository(Book);
    expect(result).toBe(true);
    expect(stored).toHaveLength(before.length + 1);
    expect(stored[0]).toBeInstanceOf(Book);
    expect(stored[0].CallNo).toBe('1');
    expect(stored[0].Title).toBe('2');
    expect(stored[0].Edition).toBe('3');
    expect(stored[0].Author).toBe('4');
    expect(stored[0].Publisher).toBe('5');
    expect(stored[0].Description).toBe('6');
    expect(stored[0].ISBn).toBe('7');
    expect(stored[0].CopyNum).toBe(8);
  });

  it('rejects a used call number without adding or replacing a Book', () => {
    const existing = Object.assign(new Book(), {CallNo: '1'});
    getRepository(Book).push(existing);
    expectPreconditionRejected(() =>
      new ManageBookCRUDService().createBook('1', '2', '3', '4', '5', '6', '7', 8)
    );
    expect(getRepository(Book)).toEqual([existing]);
  });
});
