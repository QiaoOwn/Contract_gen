import {getRepository, ManageSubjectCRUDService, Subject} from './entry';
describe('LibraryManagementSystem/ManageSubjectCRUDService/createSubject', () => {
  it('Happy Path', () => {
    const service = new ManageSubjectCRUDService();
    const result = service.createSubject('1');
    expect(result).toBe(true);
    const subject = getRepository(Subject)[0];
    expect(subject.Name).toBe('1');
  });
});
