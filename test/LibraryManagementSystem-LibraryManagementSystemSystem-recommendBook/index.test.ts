import {getRepository, LibraryManagementSystemSystem, RecommendBook, User} from './entry';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/recommendBook', () => {
  it('Happy Path', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    user.RecommendedBook = [];
    getRepository(User).push(user);
    const result = service.recommendBook(user.UserID, '1', '2', '3', '4', '5', '6', '7');
    expect(result).toBe(true);
    const recommentBook = getRepository(RecommendBook)[0];
    expect(result).toBe(true);
    expect(recommentBook.CallNo).toBe('1');
    expect(recommentBook.Title).toBe('2');
    expect(recommentBook.Edition).toBe('3');
    expect(recommentBook.Author).toBe('4');
    expect(recommentBook.Publisher).toBe('5');
    expect(recommentBook.Description).toBe('6');
    expect(recommentBook.ISBn).toBe('7');
    expect(recommentBook.RecommendDate.isSame(new Date(), 'd')).toBe(true);
    expect(recommentBook.RecommendUser).toBe(user);
    expect(user.RecommendedBook).toContain(recommentBook);
  });
});
