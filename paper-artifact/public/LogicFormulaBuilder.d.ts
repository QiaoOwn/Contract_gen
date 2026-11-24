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
declare const buildFailedPrefix = 'Build Failed -';
declare const errorSeparator = ' OR ';

type InternalRule<T = boolean> = {type: 'and' | 'or' | 'if'; rule: Rule<T>};
declare class LogicFormulaBuilder<T = boolean> {
  private internalRules: InternalRule[];
  constructor(initialRule?: LogicalRule<T>);
  and<U = boolean>(rule: Rule<U>): LogicFormulaBuilder<U>;
  or<U = boolean>(rule: Rule<U>): LogicFormulaBuilder<U>;
  if<U = boolean, T = boolean, E = boolean>(rule: IfRule<U, T, E>): LogicFormulaBuilder<U>;
  build(): {
    pass: T;
    value: T;
    errors: string[];
    errorMessage: string;
  };
}

declare const l: <T = boolean>(initialRule?: LogicalRule<T>) => LogicFormulaBuilder<T>;
export {errorSeparator, buildFailedPrefix, type Rule, l, LogicFormulaBuilder};
/*  */
