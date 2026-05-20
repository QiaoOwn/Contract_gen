import {Service} from './Service';

export class TempVariable {
  name: string;
  type: string;
  service?: Service;
  constructor({name, type}: TempVariable) {
    this.name = name;
    this.type = type;
  }
}
