import {getRepository, ManageUserCRUDService, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/ManageUserCRUDService/modifyUser', () => {
  beforeEach(() => {
    clearRepositories(getRepository(User));
  });

  it('updates the user identified by userid when another user also exists', () => {
    const service = new ManageUserCRUDService();
    const other = new User();
    other.UserID = 17;
    other.Name = 'other';
    other.Address = 'other-address';
    const target = new User();
    target.UserID = 41;
    target.Name = 'old';
    target.Address = 'old-address';
    getRepository(User).push(other, target);

    expect(service.modifyUser(41, 'new', 'new-address')).toBe(true);
    expect(target.UserID).toBe(41);
    expect(target.Name).toBe('new');
    expect(target.Address).toBe('new-address');
    expect(other.UserID).toBe(17);
    expect(other.Name).toBe('other');
    expect(other.Address).toBe('other-address');
  });

  it('rejects when user does not exist', () => {
    const service = new ManageUserCRUDService();
    expectPreconditionRejected(() => service.modifyUser(99, 'newName', 'newAddr'));
    expect(getRepository(User)).toHaveLength(0);
  });
});
