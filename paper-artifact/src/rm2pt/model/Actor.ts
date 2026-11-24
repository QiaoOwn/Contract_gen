import {UseCase} from './UseCase';

export class Actor {
  name: string;
  description: string;
  useCase?: UseCase;
  constructor({name, description}: Actor) {
    this.name = name;
    this.description = description;
  }
}
