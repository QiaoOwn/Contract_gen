import {Operation} from './Operation';
import {TempVariable} from './TempVariable';
import {UseCase} from './UseCase';

export class Service {
  name: string;
  operations: Operation[];
  useCase?: UseCase;
  tempVariables?: TempVariable[];
  constructor({name, operations, tempVariables}: Service) {
    this.name = name;
    this.operations = operations;
    this.tempVariables = tempVariables;
    this.operations.forEach((operation) => (operation.service = this));
    this.tempVariables?.forEach((tempVarible) => (tempVarible.service = this));
  }
}
