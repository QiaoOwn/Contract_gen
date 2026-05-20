import {getRepository, ManageUserCRUDService, User} from './entry';
describe('AutomatedTellerMachine/ManageUserCRUDService/deleteUser', () => {
  it('Happy Path', () => {
    const service = new ManageUserCRUDService();
    const user = new User();
    user.UserID = 1;
    getRepository(User).push(user);
    expect(getRepository(User).length).toBe(1);
    const result = service.deleteUser(user.UserID);
    expect(result).toBe(true);
    expect(getRepository(User).length).toBe(0);
  });
});
