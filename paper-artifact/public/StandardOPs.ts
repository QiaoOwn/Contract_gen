class StandardOPs {
  /** Implements OCL value equality while preserving identity equality for model objects. */
  static oclEquals(left: unknown, right: unknown): boolean {
    if (left === right) {
      return true;
    }
    if (left instanceof Date && right instanceof Date) {
      return left.getTime() === right.getTime();
    }
    if (StandardOPs.isDayjsLike(left) && StandardOPs.isDayjsLike(right)) {
      return left.isSame(right);
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      return (
        left.length === right.length &&
        left.every((item, index) => StandardOPs.oclEquals(item, right[index]))
      );
    }
    if (left instanceof Set && right instanceof Set) {
      return (
        left.size === right.size &&
        [...left].every((leftItem) =>
          [...right].some((rightItem) => StandardOPs.oclEquals(leftItem, rightItem))
        )
      );
    }
    return false;
  }

  /** Compares OCL Set values without leaking JavaScript array order or duplicates. */
  static oclSetEquals(left: unknown, right: unknown): boolean {
    const leftValues = StandardOPs.asCollection(left);
    const rightValues = StandardOPs.asCollection(right);
    if (!leftValues || !rightValues) {
      return false;
    }
    const unique = (values: unknown[]) =>
      values.filter(
        (value, index) =>
          values.findIndex((candidate) => StandardOPs.oclEquals(candidate, value)) === index
      );
    const leftUnique = unique(leftValues);
    const rightUnique = unique(rightValues);
    return (
      leftUnique.length === rightUnique.length &&
      leftUnique.every((leftItem) =>
        rightUnique.some((rightItem) => StandardOPs.oclEquals(leftItem, rightItem))
      )
    );
  }

  /** Tests OCL collection membership using OCL value equality. */
  static includes<T>(collection: readonly T[], value: T): boolean {
    return collection.some((item) => StandardOPs.oclEquals(item, value));
  }

  /** Adds a value only when no OCL-equal member is already present. */
  static includeIfAbsent<T>(collection: T[], value: T): T[] {
    if (!StandardOPs.includes(collection, value)) {
      collection.push(value);
    }
    return collection;
  }

  /** Removes one OCL-equal value and leaves the collection unchanged when absent. */
  static removeIfPresent<T>(collection: T[], value: T): T[] {
    const index = collection.findIndex((item) => StandardOPs.oclEquals(item, value));
    if (index >= 0) {
      collection.splice(index, 1);
    }
    return collection;
  }

  static includeAllIfAbsent<T>(collection: T[], values: readonly T[]): T[] {
    values.forEach((value) => StandardOPs.includeIfAbsent(collection, value));
    return collection;
  }

  static removeAllIfPresent<T>(collection: T[], values: readonly T[]): T[] {
    values.forEach((value) => StandardOPs.removeIfPresent(collection, value));
    return collection;
  }

  private static isDayjsLike(value: unknown): value is {isSame(other: unknown): boolean} {
    return (
      typeof value === 'object' &&
      value !== null &&
      'isSame' in value &&
      typeof value.isSame === 'function'
    );
  }

  private static asCollection(value: unknown): unknown[] | undefined {
    if (Array.isArray(value)) {
      return value;
    }
    if (value instanceof Set) {
      return [...value];
    }
    return undefined;
  }

  /**
   * Checks if the object is undefined.
   * @param obj object from repository
   * @returns boolean
   */
  static oclIsUndefined<T = unknown>(obj: T) {
    return obj === undefined;
  }

  /**
   * Checks if the object is the instance of clazz.
   * @param obj object from repository
   * @returns boolean
   */
  static oclIsTypeOf<T = unknown>(obj: T, clazz: new () => {}) {
    if (typeof obj === 'string') {
      return clazz === String;
    } else if (typeof obj === 'boolean') {
      return clazz === Boolean;
    } else if (typeof obj === 'number') {
      return clazz === Number;
    }
    return obj instanceof clazz;
  }

  /**
   * Checks if the object is empty.
   * @param obj objects from repository
   * @returns boolean
   */
  static isEmpty<T = unknown>(obj: T[]) {
    return obj.length === 0;
  }

  /**
   * Checks if the object is not empty.
   * @param obj objects from repository
   * @returns boolean
   */
  static notEmpty<T = unknown>(obj: T[]) {
    return obj.length !== 0;
  }

  /** Sums an OCL Set of numeric values, using zero for the empty set. */
  static sum(values: readonly number[]): number {
    return values.reduce((total, value) => total + value, 0);
  }

  /** Dialect scalar reduction: distinct source identities, not distinct projected values. */
  static sumBy<T>(values: readonly T[], selector: (value: T) => number): number {
    if (!Array.isArray(values)) throw new TypeError('sumBy requires a defined Set source');
    let total = 0;
    for (const value of new Set(values)) {
      const contribution = selector(value);
      if (typeof contribution !== 'number' || !Number.isFinite(contribution))
        throw new TypeError('sumBy requires a finite numeric selector value');
      total += contribution;
      if (!Number.isFinite(total)) throw new RangeError('sumBy total is not finite');
    }
    return total;
  }

  /** Dialect object projection: no target-repository lookup or attribute-based equality. */
  static projectSet<T, U extends object>(values: readonly T[], selector: (value: T) => U): U[] {
    if (!Array.isArray(values)) throw new TypeError('projectSet requires a defined Set source');
    const projected = new Set<U>();
    for (const value of new Set(values)) {
      const item = selector(value);
      if (
        item === null ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        item instanceof Set ||
        item instanceof Map ||
        item instanceof Date
      )
        throw new TypeError('projectSet requires one defined model object per source element');
      projected.add(item);
    }
    return [...projected];
  }
}

export {StandardOPs};
