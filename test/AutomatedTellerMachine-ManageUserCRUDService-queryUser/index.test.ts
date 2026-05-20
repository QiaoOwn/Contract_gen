import {getRepository, ManageUserCRUDService, User} from './entry';
describe('AutomatedTellerMachine/ManageUserCRUDService/queryUser', () => {
  it('Happy Path', () => {
    const service = new ManageUserCRUDService();
    const user = new User();
    user.UserID = 1;
    getRepository(User).push(user);
    const result = service.queryUser(user.UserID);
    expect(result).toBe(user);
  });
});
