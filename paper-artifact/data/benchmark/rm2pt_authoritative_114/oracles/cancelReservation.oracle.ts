import {User, BookCopy, Reserve, CopyStatus, LibraryManagementSystemSystem} from './entry';
import {getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('cancelReservation source acceptance', () => {
  function setup(uid = 'reader-82', barcode = 'volume-74') {
    const users = getRepository(User), copies = getRepository(BookCopy), reservations = getRepository(Reserve);
    users.splice(0); copies.splice(0); reservations.splice(0);
    const u = Object.assign(new User(), {UserID: uid, ReservedBook: [] as Reserve[]});
    const c = Object.assign(new BookCopy(), {Barcode: barcode, Status: CopyStatus.LOANED, IsReserved: true, ReservationRecord: [] as Reserve[]});
    const neighbor = Object.assign(new User(), {UserID: 'neighbor', ReservedBook: []});
    const other = Object.assign(new BookCopy(), {Barcode: 'other-copy', ReservationRecord: []});
    users.push(neighbor, u); copies.push(other, c);
    reservations.push(Object.assign(new Reserve(), {ReservedUser: neighbor, ReservedCopy: c, IsReserveClosed: false}),
      Object.assign(new Reserve(), {ReservedUser: u, ReservedCopy: other, IsReserveClosed: false}));
    const selected = Object.assign(new Reserve(), {ReservedUser: u, ReservedCopy: c, IsReserveClosed: false}); reservations.push(selected);
    return {u, c, users, copies, reservations, selected, invoke: () => new LibraryManagementSystemSystem().cancelReservation(uid, barcode)};
  }
  test.each([['reader-82', 'volume-74'], ['', '']])('accepts eligible user/copy %j/%j', (uid, barcode) => {
    const f = setup(uid, barcode);
    expect(f.invoke()).toBe(true);
    expect(f.c.IsReserved).toBe(false);
    expect(f.selected.IsReserveClosed).toBe(true);
  });
  test.each(['absent-user', 'absent-copy', 'not-loaned', 'wrong-flag', 'no-matching-pair', 'already-closed'])('rejects %s', reason => {
    const f = setup();
    if (reason === 'absent-user') f.users.splice(f.users.indexOf(f.u), 1);
    if (reason === 'absent-copy') f.copies.splice(f.copies.indexOf(f.c), 1);
    if (reason === 'not-loaned') f.c.Status = CopyStatus.AVAILABLE;
    if (reason === 'wrong-flag') f.c.IsReserved = false;
    if (reason === 'no-matching-pair') f.reservations.splice(f.reservations.indexOf(f.selected), 1);
    if (reason === 'already-closed') f.selected.IsReserveClosed = true;
    expectPreconditionRejected(f.invoke);
  });
});
