import {BorrowStatus, ManageUserCRUDService, Sex, User, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageUserCRUDService/createUser', () => {
  beforeEach(() => clearRepositories(getRepository(User)));

  it('creates exactly one stored User with all supplied values', () => {
    const result = new ManageUserCRUDService().createUser(
      '1', '2', Sex.F, '3', '4', '5', 1, BorrowStatus.NORMAL, 2, 3
    );
    const stored = getRepository(User);
    expect(result).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toBeInstanceOf(User);
    expect(stored[0].UserID).toBe('1');
    expect(stored[0].Name).toBe('2');
    expect(stored[0].Sex).toBe(Sex.F);
    expect(stored[0].Password).toBe('3');
    expect(stored[0].Email).toBe('4');
    expect(stored[0].Faculty).toBe('5');
    expect(stored[0].LoanedNumber).toBe(1);
    expect(stored[0].BorrowStatus).toBe(BorrowStatus.NORMAL);
    expect(stored[0].SuspensionDays).toBe(2);
    expect(stored[0].OverDueFee).toBe(3);
  });

  it('rejects a duplicate identifier without creating or replacing a User', () => {
    const existing = Object.assign(new User(), {UserID: '1'});
    getRepository(User).push(existing);
    expectPreconditionRejected(() => new ManageUserCRUDService().createUser(
      '1', '2', Sex.F, '3', '4', '5', 1, BorrowStatus.NORMAL, 2, 3
    ));
    expect(getRepository(User)).toEqual([existing]);
  });
});
