class StandardOPs {
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
}

export {StandardOPs};
