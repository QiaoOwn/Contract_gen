import {Book, BookCopy, CopyStatus, getRepository, ManageBookCopyCRUDService} from './entry';
describe('LibraryManagementSystem/ManageBookCopyCRUDService/addBookCopy', () => {
  it('Happy Path', () => {
    const service = new ManageBookCopyCRUDService();
    const book = new Book();
    book.CallNo = '1';
    book.Copys = [];
    book.CopyNum = 1;
    getRepository(Book).push(book);
    const result = service.addBookCopy('1', '2', '3');
    expect(result).toBe(true);
    const bookCopy = getRepository(BookCopy)[0];
    expect(bookCopy).toBeDefined();
    expect(bookCopy.Barcode).toBe('2');
    expect(bookCopy.Status).toBe(CopyStatus.AVAILABLE);
    expect(bookCopy.Location).toBe('3');
    expect(bookCopy.IsReserved).toBe(false);
    expect(bookCopy.BookBelongs).toBe(book);
    expect(book.CopyNum).toBe(2);
  });
});
