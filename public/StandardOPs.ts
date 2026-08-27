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
}

export {StandardOPs};
