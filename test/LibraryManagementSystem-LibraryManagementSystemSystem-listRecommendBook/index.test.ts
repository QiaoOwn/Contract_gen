import {getRepository, LibraryManagementSystemSystem, RecommendBook, User} from './entry';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/listRecommendBook', () => {
  it('Happy Path', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    getRepository(User).push(user);
    const a = new RecommendBook();
    user.RecommendedBook = [a];
    const result = service.listRecommendBook(user.UserID);
    expect(result).toBe(user.RecommendedBook);
  });
});
