import {ListBookHistory, User, RecommendBook, getRepository} from './entry';

// Same original OP19 as the standalone view; independent of development fixtures.
describe('OP19 recommendation-list history view', () => {
  beforeEach(() => {getRepository(User).splice(0); getRepository(RecommendBook).splice(0);});
  it.each(['selected-last', 'equal-attributes', 'empty-id'])('returns all and only the selected User recommendation identities: %s', kind => {
    const uid = kind === 'empty-id' ? '' : 'reader-eval-42';
    const a = Object.assign(new RecommendBook(), {Title: 'Shared title'});
    const b = Object.assign(new RecommendBook(), {Title: kind === 'equal-attributes' ? 'Shared title' : 'Other title'});
    const outsider = new RecommendBook();
    getRepository(RecommendBook).push(outsider, a, b);
    getRepository(User).push(Object.assign(new User(), {UserID: 'different-reader', RecommendedBook: [outsider]}),
      Object.assign(new User(), {UserID: uid, RecommendedBook: [a, b]}));
    const result = new ListBookHistory().listRecommendBook(uid);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(new Set(result).size).toBe(2);
    expect(result).toContain(a); expect(result).toContain(b);
  });
  it('accepts an existing empty recommendation collection', () => {
    getRepository(User).push(Object.assign(new User(), {UserID: 'empty-reader', RecommendedBook: []}));
    expect(new ListBookHistory().listRecommendBook('empty-reader')).toEqual([]);
  });
  it('rejects an unresolved recommendation collection', () => {
    getRepository(User).push(Object.assign(new User(), {UserID: 'unset-reader'}));
    expect(() => new ListBookHistory().listRecommendBook('unset-reader')).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
  it('does not complete normally for an unknown user', () => {
    expect(() => new ListBookHistory().listRecommendBook('absent-reader')).toThrow(expect.objectContaining({name: 'PreconditionError'}));
    // This does not certify whether rejection occurred in Definition or in Precondition.
  });
});
