declare global {
  interface Array<T> {
    /**
     * remove element from current array
     * @param target
     * @param count
     */
    remove(target: T): T[];

    /**
     * sum the array element
     */
    sum(): number;
  }
}

Array.prototype.sum = function (this: number[]): number {
  return this.reduce((p, c) => {
    return p + c;
  }, 0);
};

Array.prototype.remove = function <T>(this: T[], target: T): T[] {
  const index = this.findIndex((e) => e === target);
  if (index >= 0) {
    this.splice(index, 1);
  }
  return this;
};

export {};

//todo: add cases for the LogicFormulaBuilder<T> and recursive rules

type Logic<T = boolean> = T | LogicFormulaBuilder<T>;
type LogicalRule<T = boolean> = {
  logic?: () => Logic<T>;
  execute?: () => Logic<T>;
  description: string;
};

type IfRule<I = boolean, T = boolean, E = boolean> = {
  logic: () => Logic<I>;
  description: string;
  then: Rule<T>;
  else?: Rule<E>;
};

type Rule<T = boolean> = LogicalRule<T> | LogicFormulaBuilder<T> | IfRule<T>;

type InternalRule<T = boolean> = {type: 'and' | 'or' | 'if'; rule: Rule<T>};

const buildFailedPrefix = 'Build Failed -';
const errorSeparator = ' OR ';

class LogicFormulaBuilder<T = boolean> {
  private internalRules: InternalRule<unknown>[] = [];
  constructor(initialRule?: LogicalRule<T>) {
    if (initialRule) {
      const internalInitialRule: InternalRule<T> = {type: 'and', rule: initialRule};
      this.internalRules = [internalInitialRule];
    }
  }
  private initRule<T = boolean>(rule: LogicalRule<T>) {
    if (!rule.logic) {
      rule.logic = () => true as T;
    }
  }
  // todo merge or and add?
  and<U = boolean>(rule: Rule<U>): LogicFormulaBuilder<U> {
    this.internalRules.push({rule, type: 'and'});
    return this as unknown as LogicFormulaBuilder<U>;
  }

  or<U = boolean>(rule: Rule<U>): LogicFormulaBuilder<U> {
    this.internalRules.push({rule, type: 'or'});
    return this as unknown as LogicFormulaBuilder<U>;
  }

  if<U = boolean, T = boolean, E = boolean>(rule: IfRule<U, T, E>) {
    this.internalRules.push({rule, type: 'if'});
    return this as unknown as LogicFormulaBuilder<T | E>;
  }
  private createErrorMessage(errors: string[]) {
    return `${errors.map((error) => `(${buildFailedPrefix} ${error})`).join(errorSeparator)}`;
  }

  build(): {pass: T; value: T; errors: string[]; errorMessage: string} {
    let andRules: Rule<unknown>[] = [];
    const orRules: Rule<unknown>[][] = [andRules];
    this.internalRules.forEach((internalRule) => {
      if (internalRule.type === 'and' || internalRule.type === 'if') {
        andRules.push(internalRule.rule);
      } else if (internalRule.type === 'or') {
        andRules = [internalRule.rule];
        orRules.push(andRules);
      }
    });
    let fullErrorMessagesArr: string[] = [];
    let pass: T = undefined as T;
    let value: T = undefined as T;
    for (let i = 0; i < orRules.length; i++) {
      const andRules = orRules[i];
      let errorMessage = '';
      for (let j = 0; j < andRules.length; j++) {
        const rule = andRules[j];
        if (rule instanceof LogicFormulaBuilder) {
          const result = rule.build();
          pass = result.pass as T;
          value = result.value as T;
          errorMessage = this.createErrorMessage(result.errors);
        } else {
          this.initRule(rule);
          pass = rule.logic!() as T;
          if (pass instanceof LogicFormulaBuilder) {
            const result = pass.build();
            pass = result.pass as T;
            value = result.value as T;
            errorMessage = this.createErrorMessage(result.errors);
          }
          // deal with if rule
          const ifRule = rule as IfRule;
          if (ifRule.then) {
            if (pass) {
              if (ifRule.then instanceof LogicFormulaBuilder) {
                const result = ifRule.then.build();
                pass = result.pass as T;
                value = result.value as T;
                errorMessage = this.createErrorMessage(result.errors);
              } else {
                this.initRule(ifRule.then);
                pass = ifRule.then.logic!() as T;
                value = (ifRule.then as LogicalRule).execute?.() as T;
                if (!pass) {
                  errorMessage = ifRule.then.description;
                }
              }
            } else if (ifRule.else) {
              if (ifRule.else instanceof LogicFormulaBuilder) {
                const result = ifRule.else.build();
                pass = result.pass as T;
                value = result.value as T;
                errorMessage = this.createErrorMessage(result.errors);
              } else {
                this.initRule(ifRule.else);
                pass = ifRule.else.logic!() as T;
                value = (ifRule.else as LogicalRule).execute?.() as T;
                if (!pass) {
                  errorMessage = ifRule.else.description;
                }
              }
            } else {
              // TBD currently if no else, the rule should be auto passed
              pass = true as T;
            }
          } else if (!pass) {
            errorMessage = rule.description;
          } else {
            const executionResult = (rule as LogicalRule).execute?.();
            if (executionResult instanceof LogicFormulaBuilder) {
              const result = executionResult.build();
              pass = result.pass as T;
              value = result.value as T;
              errorMessage = this.createErrorMessage(result.errors);
            } else {
              value = executionResult as T;
            }
          }
          if (!pass) {
            fullErrorMessagesArr.push(errorMessage);
            break;
          }
        }
      }
      if (!errorMessage) {
        fullErrorMessagesArr = [];
        break;
      }
    }
    return {
      pass,
      value,
      errors: fullErrorMessagesArr,
      errorMessage: this.createErrorMessage(fullErrorMessagesArr),
    };
  }
}
const l = <T = boolean>(initialRule?: LogicalRule<T>) => new LogicFormulaBuilder<T>(initialRule);
export {errorSeparator, buildFailedPrefix, type Rule, l, LogicFormulaBuilder};

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

class PreconditionError extends Error {
  constructor(message: string) {
    super(`Precondition validation failed:  ${message}`);
    this.name = 'PreconditionError';
  }
}

const evaluateDefinition = <T>(evaluation: () => T): T => {
  try {
    return evaluation();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PreconditionError(`definition binding could not be evaluated: ${detail}`);
  }
};

export {evaluateDefinition, PreconditionError};

class PostconditionError extends Error {
  constructor(message: string) {
    super(`Postcondition validation failed: ${message}`);
    this.name = 'PostconditionError';
  }
}

export {PostconditionError};

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

type OCLExecutionTraceEntry = {
  name: string;
  args: readonly unknown[];
  result?: unknown;
  error?: unknown;
};

const sameArguments = (left: readonly unknown[], right: readonly unknown[]) =>
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]));

/** Records effectful calls so postcondition checking never invokes them twice. */
class OCLExecutionTrace {
  private readonly entries: OCLExecutionTraceEntry[] = [];

  call<T>(name: string, args: readonly unknown[], invoke: () => T): T {
    try {
      const result = invoke();
      this.entries.push({name, args: [...args], result});
      return result;
    } catch (error) {
      this.entries.push({name, args: [...args], error});
      throw error;
    }
  }

  wasCalled(name: string, args: readonly unknown[]): boolean {
    return this.entries.some(
      (entry) => entry.name === name && !entry.error && sameArguments(entry.args, args)
    );
  }

  getEntries(): readonly OCLExecutionTraceEntry[] {
    return this.entries.map((entry) => ({...entry, args: [...entry.args]}));
  }
}

export {OCLExecutionTrace, type OCLExecutionTraceEntry};
