import {Book, getRepository, SearchBook, Subject} from './entry';
describe('LibraryManagementSystem/SearchBook/searchBookBySubject', () => {
  it('Happy Path', () => {
    const service = new SearchBook();
    const book = new Book();
    const subject = new Subject();
    subject.Name = 'test';
    book.Subject = [subject];
    getRepository(Book).push(book);
    getRepository(Subject).push(subject);
    const result = service.searchBookBySubject(subject.Name);
    expect(result).toContain(book);
  });
});
