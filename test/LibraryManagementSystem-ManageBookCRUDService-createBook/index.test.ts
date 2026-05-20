import {Book, getRepository, ManageBookCRUDService} from './entry';
describe('LibraryManagementSystem/ManageBookCRUDService/createBook', () => {
  it('Happy Path', () => {
    const service = new ManageBookCRUDService();
    const result = service.createBook('1', '2', '3', '4', '5', '6', '7', 8);
    expect(result).toBe(true);
    const book = getRepository(Book)[0];
    expect(book.CallNo).toBe('1');
    expect(book.Title).toBe('2');
    expect(book.Edition).toBe('3');
    expect(book.Author).toBe('4');
    expect(book.Publisher).toBe('5');
    expect(book.Description).toBe('6');
    expect(book.ISBn).toBe('7');
    expect(book.CopyNum).toBe(8);
  });
});
