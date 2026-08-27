import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/createUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('Happy Path: creates user with supplied fields', () => {
    const service = new ManageUserCRUDService();
    const result = service.createUser(1, 'alice', 'addr');
    expect(result).toBe(true);
    const user = getRepository(User).find((e) => e.UserID === 1);
    expect(user).toBeDefined();
    expect(user?.Name).toBe('alice');
    expect(user?.Address).toBe('addr');
  });

  it('rejects when user identifier is already used', () => {
    const existing = new User();
    existing.UserID = 1;
    getRepository(User).push(existing);
    const service = new ManageUserCRUDService();
    expectPreconditionRejected(() => service.createUser(1, 'alice', 'addr'));
    expect(getRepository(User)).toHaveLength(1);
    expect(getRepository(User)[0]).toBe(existing);
  });
});
