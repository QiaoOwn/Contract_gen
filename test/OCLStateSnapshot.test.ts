import {OCLStateSnapshot} from '../public/OCLStateSnapshot';

class Book {
  constructor(
    public status: string,
    public tags: string[] = []
  ) {}
}

describe('OCLStateSnapshot', () => {
  test('preserves scalar and collection values from the pre-state', () => {
    const book = new Book('AVAILABLE', ['featured']);
    const repository = [book];
    const state = new OCLStateSnapshot(new Map([[Book, repository]]));

    book.status = 'LOANED';
    book.tags.push('borrowed');
    state.capturePost();

    expect(state.preValue(book, 'status')).toBe('AVAILABLE');
    expect(state.preValue(book, 'tags')).toEqual(['featured']);
    expect(book.tags).toEqual(['featured', 'borrowed']);
  });

  test('captures service-level roots used by self.attr@pre', () => {
    const service = {active: false};
    const state = new OCLStateSnapshot(new Map(), [service]);

    service.active = true;

    expect(state.preValue(service, 'active')).toBe(false);
  });

  test('represents an uninitialized captured property as OCL undefined', () => {
    const user: {borrowStatus?: string; suspensionDays: number} = {suspensionDays: 1};
    const state = new OCLStateSnapshot(new Map(), [user]);

    user.borrowStatus = 'NORMAL';

    expect(state.preValue(user, 'borrowStatus')).toBeUndefined();
  });

  test('rejects a pre-state lookup for an object outside the snapshot', () => {
    const state = new OCLStateSnapshot(new Map());
    const detached = {status: 'AVAILABLE'};

    expect(() => state.preValue(detached, 'status')).toThrow(
      'No pre-state object captured for status'
    );
  });

  test('captures objects reachable through service fields and repository relationships', () => {
    const nestedBook = new Book('AVAILABLE');
    const service = {current: {books: [nestedBook]}};
    const state = new OCLStateSnapshot(new Map(), [service]);

    nestedBook.status = 'LOANED';

    expect(state.preValue(nestedBook, 'status')).toBe('AVAILABLE');
  });

  test('recognizes an object only when it is absent before and present after', () => {
    const existing = new Book('AVAILABLE');
    const created = new Book('LOANED');
    const repository = [existing];
    const state = new OCLStateSnapshot(new Map([[Book, repository]]));

    repository.push(created);
    state.capturePost();

    expect(state.isNew(created, Book)).toBe(true);
    expect(state.isNew(existing, Book)).toBe(false);
    expect(state.findNew(Book)).toBe(created);
  });

  test('does not treat an unregistered object as new', () => {
    const detached = new Book('LOANED');
    const state = new OCLStateSnapshot(new Map([[Book, []]]));

    state.capturePost();

    expect(state.isNew(detached, Book)).toBe(false);
  });

  test('rejects ambiguous new-object bindings', () => {
    const repository: Book[] = [];
    const state = new OCLStateSnapshot(new Map([[Book, repository]]));
    repository.push(new Book('LOANED'), new Book('LOANED'));
    state.capturePost();

    expect(() => state.findNew(Book)).toThrow('Expected exactly one new Book instance');
  });

  test('requires an explicit post-state capture', () => {
    const state = new OCLStateSnapshot(new Map([[Book, []]]));

    expect(() => state.findNew(Book)).toThrow('capturePost() must be called');
  });
});
