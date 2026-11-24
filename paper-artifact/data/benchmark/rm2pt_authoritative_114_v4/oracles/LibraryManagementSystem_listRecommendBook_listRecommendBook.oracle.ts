import {LibraryManagementSystemSystem, User, RecommendBook, getRepository} from './entry';

// R08: standalone service view of original ListBookHistory::listRecommendBook (OP19).
// v4 adds association-only reachability: RecommendBook need not be repository-stored.
describe('OP19 recommendation-list standalone view', () => {
  beforeEach(() => {getRepository(User).splice(0); getRepository(RecommendBook).splice(0);});
  it.each(['selected-last', 'equal-attributes', 'empty-id'])('returns all and only the selected User recommendation identities: %s', kind => {
    const uid = kind === 'empty-id' ? '' : 'reader-eval-42';
    const a = Object.assign(new RecommendBook(), {Title: 'Shared title'});
    const b = Object.assign(new RecommendBook(), {Title: kind === 'equal-attributes' ? 'Shared title' : 'Other title'});
    const outsider = new RecommendBook();
    getRepository(RecommendBook).push(outsider, a, b);
    getRepository(User).push(Object.assign(new User(), {UserID: 'different-reader', RecommendedBook: [outsider]}),
      Object.assign(new User(), {UserID: uid, RecommendedBook: [a, b]}));
    const result = new LibraryManagementSystemSystem().listRecommendBook(uid);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(new Set(result).size).toBe(2);
    expect(result).toContain(a); expect(result).toContain(b);
  });
  it('accepts an existing empty recommendation collection', () => {
    getRepository(User).push(Object.assign(new User(), {UserID: 'empty-reader', RecommendedBook: []}));
    expect(new LibraryManagementSystemSystem().listRecommendBook('empty-reader')).toEqual([]);
  });
  it('navigates association-only recommendations without a repository-membership guard', () => {
    const first = Object.assign(new RecommendBook(), {Title: 'Linked only'});
    const second = Object.assign(new RecommendBook(), {Title: 'Also linked only'});
    getRepository(User).push(Object.assign(new User(), {
      UserID: 'linked-reader', RecommendedBook: [first, second],
    }));
    expect(getRepository(RecommendBook)).toHaveLength(0);
    const result = new LibraryManagementSystemSystem().listRecommendBook('linked-reader');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(new Set(result).size).toBe(2);
    expect(result).toContain(first);
    expect(result).toContain(second);
  });
  it('rejects an unresolved recommendation collection', () => {
    getRepository(User).push(Object.assign(new User(), {UserID: 'unset-reader'}));
    expect(() => new LibraryManagementSystemSystem().listRecommendBook('unset-reader')).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
  it('does not complete normally for an unknown user', () => {
    expect(() => new LibraryManagementSystemSystem().listRecommendBook('absent-reader')).toThrow(expect.objectContaining({name: 'PreconditionError'}));
    // This does not certify whether rejection occurred in Definition or in Precondition.
  });
});
