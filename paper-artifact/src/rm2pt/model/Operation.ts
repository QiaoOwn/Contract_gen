import {Parameter} from './Parameter';
import {ReturnedType} from './ReturnedType';
import {Service} from './Service';
export enum Level {
  Easy,
  Hard,
}
export class Operation {
  name: string;
  description: string;
  parameters?: Parameter[];
  returnType?: ReturnedType;
  service?: Service;
  definition?: string;
  precondition: string;
  postcondition: string;
  level?: Level;
  constructor({
    name,
    description,
    parameters,
    returnType,
    level = Level.Easy,
    definition,
    precondition,
    postcondition,
  }: Operation) {
    this.level = level;
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.returnType = returnType;
    if (this.returnType) {
      this.returnType.operation = this;
    }
    this.parameters?.forEach((parameter) => (parameter.operation = this));
    this.definition = definition;
    this.precondition = precondition;
    this.postcondition = postcondition;
  }
}
