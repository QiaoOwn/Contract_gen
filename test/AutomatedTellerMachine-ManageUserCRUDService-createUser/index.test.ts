import {getRepository, ManageUserCRUDService, User} from './entry';
describe('AutomatedTellerMachine/ManageUserCRUDService/createUser', () => {
  it('Happy Path', () => {
    const service = new ManageUserCRUDService();
    const result = service.createUser(1, 'a', '23456');
    expect(result).toBe(true);
    expect(getRepository(User).find((e) => e.UserID === 1)).toBeDefined();
  });
});
