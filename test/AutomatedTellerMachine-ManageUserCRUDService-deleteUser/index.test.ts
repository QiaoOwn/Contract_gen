import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/deleteUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('Happy Path: removes user from repository', () => {
    const service = new ManageUserCRUDService();
    const user = new User();
    user.UserID = 1;
    getRepository(User).push(user);
    const result = service.deleteUser(user.UserID);
    expect(result).toBe(true);
    expect(getRepository(User)).toHaveLength(0);
  });

  it('rejects when user does not exist', () => {
    const service = new ManageUserCRUDService();
    expectPreconditionRejected(() => service.deleteUser(99));
    expect(getRepository(User)).toHaveLength(0);
  });
});
