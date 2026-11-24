import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/createUser', () => {
  beforeEach(() => clearRepositories(getRepository(User)));

  it('creates exactly one user with the supplied fields', () => {
    const service = new ManageUserCRUDService();
    expect(service.createUser(1, 'alice', 'addr')).toBe(true);
    const users = getRepository(User);
    expect(users).toHaveLength(1);
    expect(users[0].UserID).toBe(1);
    expect(users[0].Name).toBe('alice');
    expect(users[0].Address).toBe('addr');
  });

  it('rejects a reused identifier without adding or modifying a user', () => {
    const existing = new User();
    existing.UserID = 1;
    existing.Name = 'original';
    existing.Address = 'original-address';
    getRepository(User).push(existing);
    const service = new ManageUserCRUDService();
    expectPreconditionRejected(() => service.createUser(1, 'alice', 'addr'));
    expect(getRepository(User)).toEqual([existing]);
    expect(existing.Name).toBe('original');
    expect(existing.Address).toBe('original-address');
  });
});
