import {Book, getRepository, SearchBook} from './entry';
describe('LibraryManagementSystem/SearchBook/searchBookByAuthor', () => {
  it('Happy Path', () => {
    const service = new SearchBook();
    const book = new Book();
    book.Author = 'test';
    getRepository(Book).push(book);
    const result = service.searchBookByAuthor(book.Author);
    expect(result).toContain(book);
  });
});
