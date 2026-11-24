import dayjs from 'dayjs';
import {User, BookCopy, Reserve, CopyStatus, LibraryManagementSystemSystem} from './entry';
import {getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('makeReservation source acceptance', () => {
  function setup(uid = 'reader-82', barcode = 'volume-74') {
    const users = getRepository(User), copies = getRepository(BookCopy), reservations = getRepository(Reserve);
    users.splice(0); copies.splice(0); reservations.splice(0);
    const u = Object.assign(new User(), {UserID: uid, ReservedBook: [] as Reserve[]});
    const c = Object.assign(new BookCopy(), {Barcode: barcode, Status: CopyStatus.LOANED, IsReserved: false, ReservationRecord: [] as Reserve[]});
    const neighbor = Object.assign(new User(), {UserID: 'neighbor', ReservedBook: []});
    const other = Object.assign(new BookCopy(), {Barcode: 'other-copy', ReservationRecord: []});
    users.push(neighbor, u); copies.push(other, c);
    reservations.push(Object.assign(new Reserve(), {ReservedUser: neighbor, ReservedCopy: c, IsReserveClosed: false}),
      Object.assign(new Reserve(), {ReservedUser: u, ReservedCopy: other, IsReserveClosed: false}));
    
    return {u, c, users, copies, reservations, invoke: () => new LibraryManagementSystemSystem().makeReservation(uid, barcode)};
  }
  test.each([['reader-82', 'volume-74'], ['', '']])('accepts eligible user/copy %j/%j', (uid, barcode) => {
    const f = setup(uid, barcode);
    const prior = new Set(f.reservations), today = dayjs();
    expect(f.invoke()).toBe(true);
    expect(f.c.IsReserved).toBe(true);
    expect(f.reservations.some(r => r instanceof Reserve && !prior.has(r) && r.IsReserveClosed === false &&
      r.ReservedUser === f.u && r.ReservedCopy === f.c && r.ReserveDate?.isSame(today, 'day') &&
      f.u.ReservedBook.includes(r) && f.c.ReservationRecord.includes(r))).toBe(true);
  });
  test.each(['absent-user', 'absent-copy', 'not-loaned', 'wrong-flag'])('rejects %s', reason => {
    const f = setup();
    if (reason === 'absent-user') f.users.splice(f.users.indexOf(f.u), 1);
    if (reason === 'absent-copy') f.copies.splice(f.copies.indexOf(f.c), 1);
    if (reason === 'not-loaned') f.c.Status = CopyStatus.AVAILABLE;
    if (reason === 'wrong-flag') f.c.IsReserved = true;
    
    expectPreconditionRejected(f.invoke);
  });
});
