import {
  BookCopy,
  ListBookHistory,
  Reserve,
  User,
  getRepository,
} from './listReservationBook.reference';
import {clearRepositories, expectSameMembers} from '../../../test/helpers/contractOracle';

describe('lab adjudication: listReservationBook', () => {
  beforeEach(() =>
    clearRepositories(getRepository(BookCopy), getRepository(Reserve), getRepository(User))
  );

  it('returns each reserved copy once and excludes other users', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = 'selected';
    const shared = new BookCopy();
    const first = new Reserve();
    first.ReservedCopy = shared;
    const second = new Reserve();
    second.ReservedCopy = shared;
    user.ReservedBook = [first, second];
    const other = new User();
    other.UserID = 'other';
    const foreignCopy = new BookCopy();
    const foreign = new Reserve();
    foreign.ReservedCopy = foreignCopy;
    other.ReservedBook = [foreign];
    getRepository(User).push(user, other);

    expectSameMembers(service.listReservationBook('selected'), [shared]);
    expect(user.ReservedBook).toEqual([first, second]);
    expect(other.ReservedBook).toEqual([foreign]);
  });
});
