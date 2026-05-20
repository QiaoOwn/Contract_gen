import {Entity} from './Entity';

export class Relationship {
  name: string;
  description: string;
  relatedEntity: string;
  associationType: 'Association' | 'Aggregation' | 'Composition';
  entity?: Entity;
  constructor({name, description, relatedEntity, associationType}: Relationship) {
    this.name = name;
    this.associationType = associationType;
    this.description = description;
    this.relatedEntity = relatedEntity;
  }
}
