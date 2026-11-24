import dayjs from 'dayjs';
import {User, BookCopy, Reserve, CopyStatus, LibraryManagementSystemSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/makeReservation', () => {
  function setup(uid = 'reader-82', barcode = 'volume-74') {
    const users = getRepository(User), copies = getRepository(BookCopy), reservations = getRepository(Reserve);
    users.splice(0); copies.splice(0); reservations.splice(0);
    const u = Object.assign(new User(), {UserID: uid, ReservedBook: [] as Reserve[]});
    const c = Object.assign(new BookCopy(), {Barcode: barcode, Status: CopyStatus.LOANED,
      IsReserved: false, ReservationRecord: [] as Reserve[]});
    const neighbor = Object.assign(new User(), {UserID: 'neighbor', ReservedBook: [] as Reserve[]});
    const other = Object.assign(new BookCopy(), {Barcode: 'other-copy', ReservationRecord: [] as Reserve[]});
    users.push(neighbor, u); copies.push(other, c);
    reservations.push(
      Object.assign(new Reserve(), {ReservedUser: neighbor, ReservedCopy: c, IsReserveClosed: false}),
      Object.assign(new Reserve(), {ReservedUser: u, ReservedCopy: other, IsReserveClosed: false})
    );
    return {u, c, users, copies, reservations,
      invoke: () => new LibraryManagementSystemSystem().makeReservation(uid, barcode)};
  }

  it.each([['reader-82', 'volume-74'], ['', '']])('creates one linked reservation for %j/%j', (uid, barcode) => {
    const f = setup(uid, barcode);
    const before = [...f.reservations], today = dayjs();
    expect(f.invoke()).toBe(true);
    const created = f.reservations.filter(record => !before.includes(record));
    expect(f.reservations).toHaveLength(before.length + 1);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Reserve);
    expect(created[0].IsReserveClosed).toBe(false);
    expect(created[0].ReservedUser).toBe(f.u);
    expect(created[0].ReservedCopy).toBe(f.c);
    expect(created[0].ReserveDate?.isSame(today, 'day')).toBe(true);
    expect(f.u.ReservedBook).toContain(created[0]);
    expect(f.c.ReservationRecord).toContain(created[0]);
    expect(f.c.IsReserved).toBe(true);
  });

  it.each(['absent-user', 'absent-copy', 'not-loaned', 'wrong-flag'])('rejects %s without storing a reservation', reason => {
    const f = setup();
    if (reason === 'absent-user') f.users.splice(f.users.indexOf(f.u), 1);
    if (reason === 'absent-copy') f.copies.splice(f.copies.indexOf(f.c), 1);
    if (reason === 'not-loaned') f.c.Status = CopyStatus.AVAILABLE;
    if (reason === 'wrong-flag') f.c.IsReserved = true;
    const before = [...f.reservations];
    const originalFlag = f.c.IsReserved;
    expectPreconditionRejected(f.invoke);
    expect(f.reservations).toEqual(before);
    expect(f.c.IsReserved).toBe(originalFlag);
  });
});
