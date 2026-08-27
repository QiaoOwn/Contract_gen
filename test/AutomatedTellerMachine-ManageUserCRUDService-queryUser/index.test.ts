import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/queryUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('Happy Path: returns the referenced user', () => {
    const service = new ManageUserCRUDService();
    const user = new User();
    user.UserID = 1;
    getRepository(User).push(user);
    const result = service.queryUser(user.UserID);
    expect(result).toBe(user);
  });

  it('rejects when user does not exist', () => {
    const service = new ManageUserCRUDService();
    expectPreconditionRejected(() => service.queryUser(99));
  });
});
