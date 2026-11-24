import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/deleteUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('deletes only the user identified by userid', () => {
    const service = new ManageUserCRUDService();
    const keep = new User();
    keep.UserID = 17;
    const target = new User();
    target.UserID = 41;
    getRepository(User).push(keep, target);
    expect(service.deleteUser(41)).toBe(true);
    expect(getRepository(User)).toEqual([keep]);
  });

  it('rejects when user does not exist', () => {
    const service = new ManageUserCRUDService();
    const keep = new User();
    keep.UserID = 17;
    getRepository(User).push(keep);
    expectPreconditionRejected(() => service.deleteUser(99));
    expect(getRepository(User)).toEqual([keep]);
  });
});
