import {Attribute} from './Attribute';
import {Relationship} from './Relationship';

export class Entity {
  name: string;
  extends?: Entity;
  description: string;
  attributes: Attribute[];
  relationships?: Relationship[];
  constructor({name, description, attributes, relationships, extends: extendz}: Entity) {
    this.name = name;
    this.extends = extendz;
    this.description = description;
    this.attributes = attributes;
    this.attributes.forEach((attribute) => (attribute.entity = this));
    this.relationships = relationships;
    this.relationships?.forEach((relationship) => (relationship.entity = this));
  }
}
