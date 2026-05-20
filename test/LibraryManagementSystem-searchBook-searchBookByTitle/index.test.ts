import {Book, getRepository, SearchBook} from './entry';
describe('LibraryManagementSystem/SearchBook/searchBookByTitle', () => {
  it('Happy Path', () => {
    const service = new SearchBook();
    const book = new Book();
    book.Title = 'test';
    getRepository(Book).push(book);
    const result = service.searchBookByTitle(book.Title);
    expect(result).toContain(book);
  });
});
