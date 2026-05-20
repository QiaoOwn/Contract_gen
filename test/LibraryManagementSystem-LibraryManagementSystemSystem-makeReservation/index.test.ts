import {
  Book,
  BookCopy,
  CopyStatus,
  getRepository,
  LibraryManagementSystemSystem,
  Reserve,
  User,
} from './entry';
describe('LibraryManagementSystem/LibraryManagementSystemSystem/makeReservation', () => {
  it('Happy Path', () => {
    const service = new LibraryManagementSystemSystem();
    const user = new User();
    user.UserID = '1';
    user.ReservedBook = [];
    const bookCopy = new BookCopy();
    bookCopy.Barcode = '1';
    bookCopy.Status = CopyStatus.LOANED;
    bookCopy.IsReserved = false;
    bookCopy.ReservationRecord = [];
    getRepository(User).push(user);
    getRepository(BookCopy).push(bookCopy);
    const result = service.makeReservation(user.UserID, bookCopy.Barcode);
    expect(result).toBe(true);
    expect(user.ReservedBook.length).toBe(1);
    expect(bookCopy.ReservationRecord.length).toBe(1);
    expect(getRepository(Reserve).length).toBe(1);
  });
});
