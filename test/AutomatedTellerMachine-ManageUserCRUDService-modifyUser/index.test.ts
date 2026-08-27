import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/modifyUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('Happy Path: updates user name and address', () => {
    const service = new ManageUserCRUDService();
    const user = new User();
    user.UserID = 1;
    getRepository(User).push(user);
    const result = service.modifyUser(user.UserID, 'newName', 'newAddr');
    expect(result).toBe(true);
    expect(user.Name).toBe('newName');
    expect(user.Address).toBe('newAddr');
  });

  it('rejects when user does not exist', () => {
    const service = new ManageUserCRUDService();
    expectPreconditionRejected(() => service.modifyUser(99, 'newName', 'newAddr'));
    expect(getRepository(User)).toHaveLength(0);
  });
});
