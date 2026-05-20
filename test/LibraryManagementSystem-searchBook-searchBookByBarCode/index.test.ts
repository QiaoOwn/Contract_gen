import {Book, BookCopy, getRepository, SearchBook} from './entry';
describe('LibraryManagementSystem/SearchBook/searchBookByBarCode', () => {
  it('Happy Path', () => {
    const service = new SearchBook();
    const book = new Book();
    const copy = new BookCopy();
    copy.Barcode = '1';
    book.Copys = [copy];
    getRepository(Book).push(book);
    getRepository(BookCopy).push(copy);
    const result = service.searchBookByBarCode(copy.Barcode);
    expect(result).toContain(book);
  });
});
