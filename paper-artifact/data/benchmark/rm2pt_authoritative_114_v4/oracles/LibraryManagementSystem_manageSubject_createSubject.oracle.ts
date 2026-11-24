import {ManageSubjectCRUDService, Subject, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ManageSubjectCRUDService/createSubject', () => {
  beforeEach(() => clearRepositories(getRepository(Subject)));

  it('creates exactly one stored Subject with the supplied name beside an existing neighbor', () => {
    const neighbor = Object.assign(new Subject(), {Name: 'neighbor'});
    getRepository(Subject).push(neighbor);
    expect(new ManageSubjectCRUDService().createSubject('databases')).toBe(true);
    const added = getRepository(Subject).filter(item => item !== neighbor);
    expect(getRepository(Subject)).toHaveLength(2);
    expect(added).toHaveLength(1);
    expect(added[0]).toBeInstanceOf(Subject);
    expect(added[0].Name).toBe('databases');
    expect(getRepository(Subject)).toContain(neighbor);
    expect(neighbor.Name).toBe('neighbor');
  });

  it('rejects a used name without adding or replacing a Subject', () => {
    const existing = Object.assign(new Subject(), {Name: 'databases'});
    getRepository(Subject).push(existing);
    expectPreconditionRejected(() => new ManageSubjectCRUDService().createSubject('databases'));
    expect(getRepository(Subject)).toHaveLength(1);
    expect(getRepository(Subject)[0]).toBe(existing);
    expect(existing.Name).toBe('databases');
  });
});
