import {BookCopy, getRepository, ListBookHistory, Reserve, User} from './entry';
describe('LibraryManagementSystem/ListBookHistory/listReservationBook', () => {
  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    const reserve = new Reserve();
    reserve.ReservedCopy = new BookCopy();
    user.ReservedBook = [reserve];
    getRepository(User).push(user);
    const result = service.listReservationBook(user.UserID);
    expect(result).toContain(reserve.ReservedCopy);
  });
});
