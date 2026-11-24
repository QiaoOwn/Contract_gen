import {Actor} from './Actor';
import {Service} from './Service';

export class UseCase {
  name: string;
  description: string;
  relatedService: Service;
  systemService: Service;
  involvedActors: Actor[];
  constructor({name, description, relatedService, involvedActors, systemService}: UseCase) {
    this.name = name;
    this.description = description;
    this.relatedService = relatedService;
    this.involvedActors = involvedActors;
    this.systemService = systemService;
    this.relatedService.useCase = this;
  }
}
