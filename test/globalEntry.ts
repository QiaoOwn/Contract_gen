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
  this.splice(
    this.findIndex((e) => e === target),
    1
  );
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
            value = (rule as LogicalRule).execute?.() as T;
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

class PreconditionError extends Error {
  constructor(message: string) {
    super(`Precondition validation failed:  ${message}`);
    this.name = 'PreconditionError';
  }
}
export {PreconditionError};
