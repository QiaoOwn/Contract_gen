import {Book, getRepository, SearchBook} from './entry';
describe('LibraryManagementSystem/SearchBook/searchBookByISBN', () => {
  it('Happy Path', () => {
    const service = new SearchBook();
    const book = new Book();
    book.ISBn = 'test';
    getRepository(Book).push(book);
    const result = service.searchBookByISBN(book.ISBn);
    expect(result).toContain(book);
  });
});
