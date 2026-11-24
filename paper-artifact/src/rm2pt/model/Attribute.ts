import {Entity} from './Entity';

export class Attribute {
  name: string;
  description: string;
  type: string;
  entity?: Entity;
  constructor({name, type, description}: Attribute) {
    this.name = name;
    this.description = description;
    this.type = type;
  }
}
