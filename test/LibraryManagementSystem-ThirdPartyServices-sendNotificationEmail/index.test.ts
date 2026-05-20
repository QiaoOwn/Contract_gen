import {ThirdPartyServices} from './entry';
describe('LibraryManagementSystem/ThirdPartyServices/sendNotificationEmail', () => {
  it('Happy Path', () => {
    const service = new ThirdPartyServices();
    const result = service.sendNotificationEmail('a');
    expect(result).toBe(true);
  });
});
