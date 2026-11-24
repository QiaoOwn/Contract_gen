import {Operation} from './Operation';

// Not exist in RM2PT

export class Parameter {
  name: string;
  type: string;
  operation?: Operation;
  constructor({name, type}: Parameter) {
    this.name = name;
    this.type = type;
  }
}
