import {Book, getRepository, SearchBook, Subject} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookBySubject', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book), getRepository(Subject));
  });

  it('Happy Path: returns books matching subject name', () => {
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

  it('rejects when subject is not a string', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookBySubject(1 as unknown as string));
  });
});
