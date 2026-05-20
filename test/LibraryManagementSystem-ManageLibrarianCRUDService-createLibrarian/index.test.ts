import {getRepository, Librarian, ManageLibrarianCRUDService} from './entry';
describe('LibraryManagementSystem/ManageLibrarianCRUDService/createLibrarian', () => {
  it('Happy Path', () => {
    const service = new ManageLibrarianCRUDService();
    const result = service.createLibrarian('1', '2', '3');
    expect(result).toBe(true);
    const librarian = getRepository(Librarian)[0];
    expect(librarian.LibrarianID).toBe('1');
    expect(librarian.Name).toBe('2');
    expect(librarian.Password).toBe('3');
  });
});
