import {User, BookCopy, Reserve, CopyStatus, LibraryManagementSystemSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/LibraryManagementSystemSystem/cancelReservation', () => {
  function setup(uid = 'reader-82', barcode = 'volume-74') {
    const users = getRepository(User);
    const copies = getRepository(BookCopy);
    const reservations = getRepository(Reserve);
    users.splice(0);
    copies.splice(0);
    reservations.splice(0);
    const u = Object.assign(new User(), {UserID: uid, ReservedBook: [] as Reserve[]});
    const c = Object.assign(new BookCopy(), {
      Barcode: barcode,
      Status: CopyStatus.LOANED,
      IsReserved: true,
      ReservationRecord: [] as Reserve[],
    });
    const neighbor = Object.assign(new User(), {UserID: 'neighbor', ReservedBook: [] as Reserve[]});
    const other = Object.assign(new BookCopy(), {
      Barcode: 'other-copy',
      Status: CopyStatus.LOANED,
      IsReserved: true,
      ReservationRecord: [] as Reserve[],
    });
    users.push(neighbor, u);
    copies.push(other, c);
    // Same BookCopy, different User — related but not the selected matching pair.
    const sameCopyOtherUser = Object.assign(new Reserve(), {
      ReservedUser: neighbor,
      ReservedCopy: c,
      IsReserveClosed: false,
    });
    // Same User, different BookCopy — related but not the selected matching pair.
    const sameUserOtherCopy = Object.assign(new Reserve(), {
      ReservedUser: u,
      ReservedCopy: other,
      IsReserveClosed: false,
    });
    const selected = Object.assign(new Reserve(), {
      ReservedUser: u,
      ReservedCopy: c,
      IsReserveClosed: false,
    });
    reservations.push(sameCopyOtherUser, sameUserOtherCopy, selected);
    return {
      u,
      c,
      neighbor,
      other,
      users,
      copies,
      reservations,
      selected,
      sameCopyOtherUser,
      sameUserOtherCopy,
      invoke: () => new LibraryManagementSystemSystem().cancelReservation(uid, barcode),
    };
  }

  function expectNeighborFrame(f: ReturnType<typeof setup>, selectedPresent = true) {
    expect(f.sameCopyOtherUser.IsReserveClosed).toBe(false);
    expect(f.sameCopyOtherUser.ReservedUser).toBe(f.neighbor);
    expect(f.sameCopyOtherUser.ReservedCopy).toBe(f.c);
    expect(f.sameUserOtherCopy.IsReserveClosed).toBe(false);
    expect(f.sameUserOtherCopy.ReservedUser).toBe(f.u);
    expect(f.sameUserOtherCopy.ReservedCopy).toBe(f.other);
    expect(f.other.IsReserved).toBe(true);
    expect(f.other.Barcode).toBe('other-copy');
    expect(f.neighbor.UserID).toBe('neighbor');
    expect(f.users).toEqual([f.neighbor, f.u]);
    expect(f.copies).toEqual([f.other, f.c]);
    if (selectedPresent) {
      expect(f.reservations).toEqual([f.sameCopyOtherUser, f.sameUserOtherCopy, f.selected]);
    } else {
      expect(f.reservations).toEqual([f.sameCopyOtherUser, f.sameUserOtherCopy]);
    }
  }

  test.each([
    ['reader-82', 'volume-74'],
    ['', ''],
  ])('cancels only the matching reserve for eligible user/copy %j/%j', (uid, barcode) => {
    const f = setup(uid, barcode);
    expect(f.invoke()).toBe(true);
    expect(f.c.IsReserved).toBe(false);
    expect(f.selected.IsReserveClosed).toBe(true);
    expect(f.selected.ReservedUser).toBe(f.u);
    expect(f.selected.ReservedCopy).toBe(f.c);
    expectNeighborFrame(f, true);
  });

  test.each([
    'absent-user',
    'absent-copy',
    'not-loaned',
    'wrong-flag',
    'no-matching-pair',
    'already-closed',
  ])('rejects %s without mutating neighbor reserves or the other BookCopy', reason => {
    const f = setup();
    if (reason === 'absent-user') f.users.splice(f.users.indexOf(f.u), 1);
    if (reason === 'absent-copy') f.copies.splice(f.copies.indexOf(f.c), 1);
    if (reason === 'not-loaned') f.c.Status = CopyStatus.AVAILABLE;
    if (reason === 'wrong-flag') f.c.IsReserved = false;
    if (reason === 'no-matching-pair') f.reservations.splice(f.reservations.indexOf(f.selected), 1);
    if (reason === 'already-closed') f.selected.IsReserveClosed = true;
    const targetReservedBefore = f.c.IsReserved;
    const selectedClosedBefore = f.selected.IsReserveClosed;
    expectPreconditionRejected(f.invoke);
    if (reason !== 'absent-copy') expect(f.c.IsReserved).toBe(targetReservedBefore);
    if (reason !== 'no-matching-pair') expect(f.selected.IsReserveClosed).toBe(selectedClosedBefore);
    expect(f.sameCopyOtherUser.IsReserveClosed).toBe(false);
    expect(f.sameCopyOtherUser.ReservedUser).toBe(f.neighbor);
    expect(f.sameCopyOtherUser.ReservedCopy).toBe(f.c);
    expect(f.sameUserOtherCopy.IsReserveClosed).toBe(false);
    expect(f.sameUserOtherCopy.ReservedUser).toBe(f.u);
    expect(f.sameUserOtherCopy.ReservedCopy).toBe(f.other);
    expect(f.other.IsReserved).toBe(true);
    expect(f.other.Barcode).toBe('other-copy');
    expect(f.neighbor.UserID).toBe('neighbor');
    if (reason === 'no-matching-pair') {
      expect(f.reservations).toEqual([f.sameCopyOtherUser, f.sameUserOtherCopy]);
    } else if (reason === 'absent-user') {
      expect(f.users).toEqual([f.neighbor]);
      expect(f.reservations).toEqual([f.sameCopyOtherUser, f.sameUserOtherCopy, f.selected]);
    } else if (reason === 'absent-copy') {
      expect(f.copies).toEqual([f.other]);
      expect(f.reservations).toEqual([f.sameCopyOtherUser, f.sameUserOtherCopy, f.selected]);
    } else {
      expectNeighborFrame(f, true);
    }
  });
});
