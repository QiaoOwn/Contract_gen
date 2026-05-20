import {BookCopy, getRepository, ListBookHistory, RecommendBook, Reserve, User} from './entry';
describe('LibraryManagementSystem/ListBookHistory/listRecommendBook', () => {
  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    const recommendBook = new RecommendBook();
    user.RecommendedBook = [recommendBook];
    getRepository(User).push(user);
    const result = service.listRecommendBook(user.UserID);
    expect(result).toContain(recommendBook);
  });
});
