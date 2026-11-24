import {Librarian, ManageLibrarianCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageLibrarianCRUDService/createLibrarian', () => {
  beforeEach(() => clearRepositories(getRepository(Librarian)));

  it('creates exactly one stored Librarian with all supplied values', () => {
    const result = new ManageLibrarianCRUDService().createLibrarian('1', '2', '3');
    const stored = getRepository(Librarian);
    expect(result).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toBeInstanceOf(Librarian);
    expect(stored[0].LibrarianID).toBe('1');
    expect(stored[0].Name).toBe('2');
    expect(stored[0].Password).toBe('3');
  });

  it('rejects a duplicate identifier without creating or replacing a Librarian', () => {
    const existing = Object.assign(new Librarian(), {LibrarianID: '1'});
    getRepository(Librarian).push(existing);
    expectPreconditionRejected(() => new ManageLibrarianCRUDService().createLibrarian('1', '2', '3'));
    expect(getRepository(Librarian)).toEqual([existing]);
  });
});
