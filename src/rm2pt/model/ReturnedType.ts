import {Operation} from './Operation';

export class ReturnedType {
  type: string;
  operation?: Operation;
  constructor(type: string) {
    this.type = type;
  }
}
