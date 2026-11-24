import {Book, getRepository, SearchBook, Subject} from './entry';
import {clearRepositories, expectPreconditionRejected, expectSameMembers} from '../helpers/contractOracle';

describe('LibraryManagementSystem/SearchBook/searchBookBySubject', () => {
  beforeEach(() => {
    clearRepositories(getRepository(Book), getRepository(Subject));
  });

  it('returns all matching books and excludes non-matching ones', () => {
    const service = new SearchBook();
    const matchSubject = new Subject();
    matchSubject.Name = 'databases';
    const otherSubject = new Subject();
    otherSubject.Name = 'networks';
    const match1 = new Book();
    match1.Subject = [matchSubject];
    const match2 = new Book();
    match2.Subject = [matchSubject];
    const other = new Book();
    other.Subject = [otherSubject];
    getRepository(Subject).push(matchSubject, otherSubject);
    // Non-match first so a first-element-only impl fails completeness.
    getRepository(Book).push(other, match1, match2);

    const result = service.searchBookBySubject('databases');
    expectSameMembers(result, [match1, match2]);
    expect(result).not.toContain(other);
  });

  it('rejects when subject is not a string', () => {
    const service = new SearchBook();
    expectPreconditionRejected(() => service.searchBookBySubject(1 as unknown as string));
  });
});
