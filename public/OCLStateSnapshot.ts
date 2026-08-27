type OCLConstructor<T extends object = object> = new (...args: any[]) => T;
type OCLRepositoryEntries = Iterable<readonly [OCLConstructor, readonly object[]]>;

const cloneSnapshotValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value instanceof Set) {
    return new Set(value);
  }
  if (value instanceof Map) {
    return new Map(value);
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  return value;
};

/**
 * Captures the object identities and observable property values needed by OCL
 * postconditions. A snapshot never mutates the repositories it observes.
 */
class OCLStateSnapshot {
  private readonly repositories: OCLRepositoryEntries;
  private readonly roots: readonly object[];
  private beforeMembers = new Map<OCLConstructor, Set<object>>();
  private afterMembers = new Map<OCLConstructor, Set<object>>();
  private beforeValues = new WeakMap<object, Map<PropertyKey, unknown>>();
  private postCaptured = false;

  constructor(repositories: OCLRepositoryEntries, roots: readonly object[] = []) {
    this.repositories = repositories;
    this.roots = roots;
    this.captureBefore();
  }

  capturePost(): this {
    this.afterMembers = this.captureMembers();
    this.postCaptured = true;
    return this;
  }

  preValue<T extends object, K extends keyof T>(target: T, property: K): T[K] {
    const values = this.beforeValues.get(target);
    if (!values) {
      throw new Error(`No pre-state object captured for ${String(property)}`);
    }
    return values.get(property) as T[K];
  }

  isNew<T extends object>(target: T, clazz: OCLConstructor<T>): boolean {
    this.assertPostCaptured();
    return (
      target instanceof clazz &&
      !this.beforeMembers.get(clazz)?.has(target) &&
      (this.afterMembers.get(clazz)?.has(target) ?? false)
    );
  }

  findNew<T extends object>(clazz: OCLConstructor<T>): T {
    this.assertPostCaptured();
    const before = this.beforeMembers.get(clazz) ?? new Set<object>();
    const created = [...(this.afterMembers.get(clazz) ?? new Set<object>())].filter(
      (item): item is T => item instanceof clazz && !before.has(item)
    );
    if (created.length !== 1) {
      throw new Error(
        `Expected exactly one new ${clazz.name} instance, but found ${created.length}`
      );
    }
    return created[0];
  }

  wasMember<T extends object>(target: T, clazz: OCLConstructor<T>): boolean {
    return this.beforeMembers.get(clazz)?.has(target) ?? false;
  }

  isMember<T extends object>(target: T, clazz: OCLConstructor<T>): boolean {
    this.assertPostCaptured();
    return this.afterMembers.get(clazz)?.has(target) ?? false;
  }

  private captureBefore() {
    const visited = new WeakSet<object>();
    const captureValues = (item: object) => {
      const values = new Map<PropertyKey, unknown>();
      Reflect.ownKeys(item).forEach((key) => {
        values.set(key, cloneSnapshotValue(Reflect.get(item, key)));
      });
      this.beforeValues.set(item, values);
    };

    const captureReachable = (value: unknown) => {
      if (typeof value !== 'object' || value === null || visited.has(value)) {
        return;
      }
      visited.add(value);
      if (Array.isArray(value)) {
        value.forEach(captureReachable);
        return;
      }
      if (value instanceof Set) {
        value.forEach(captureReachable);
        return;
      }
      if (value instanceof Map) {
        value.forEach((mapValue, key) => {
          captureReachable(key);
          captureReachable(mapValue);
        });
        return;
      }
      if (value instanceof Date) {
        return;
      }
      captureValues(value);
      Reflect.ownKeys(value).forEach((key) => captureReachable(Reflect.get(value, key)));
    };

    this.beforeMembers = this.captureMembers(captureReachable);
    this.roots.forEach(captureReachable);
  }

  private captureMembers(onItem?: (item: object) => void) {
    const members = new Map<OCLConstructor, Set<object>>();
    for (const [clazz, repository] of this.repositories) {
      const instances = new Set<object>();
      repository.forEach((item) => {
        instances.add(item);
        onItem?.(item);
      });
      members.set(clazz, instances);
    }
    return members;
  }

  private assertPostCaptured() {
    if (!this.postCaptured) {
      throw new Error('capturePost() must be called before evaluating a postcondition');
    }
  }
}

export {OCLStateSnapshot, type OCLConstructor, type OCLRepositoryEntries};
