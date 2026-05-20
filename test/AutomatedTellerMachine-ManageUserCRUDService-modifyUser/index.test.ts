import {getRepository, ManageUserCRUDService, User} from './entry';
describe('AutomatedTellerMachine/ManageUserCRUDService/modifyUser', () => {
  it('Happy Path', () => {
    const service = new ManageUserCRUDService();
    const user = new User();
    user.UserID = 1;
    getRepository(User).push(user);
    const result = service.modifyUser(user.UserID, 'newName', 'newAddr');
    expect(result).toBe(true);
    expect(user.Name).toBe('newName');
    expect(user.Address).toBe('newAddr');
  });
});
