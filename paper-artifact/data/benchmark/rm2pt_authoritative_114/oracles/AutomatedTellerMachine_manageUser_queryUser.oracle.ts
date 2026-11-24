import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/queryUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('returns the user identified by userid among multiple users', () => {
    const service = new ManageUserCRUDService();
    const other = new User();
    other.UserID = 17;
    other.Name = 'other';
    const target = new User();
    target.UserID = 41;
    target.Name = 'target';
    getRepository(User).push(other, target);
    expect(service.queryUser(41)).toBe(target);
  });

  it('rejects when user does not exist', () => {
    const service = new ManageUserCRUDService();
    const other = new User();
    other.UserID = 17;
    getRepository(User).push(other);
    expectPreconditionRejected(() => service.queryUser(99));
  });
});
