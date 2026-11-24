import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {StoreManager} from './actor';

const actors = [StoreManager];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'changePrice',
    description: `Definition: The changePrice operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'barcode', type: 'Integer'}),
      new Parameter({name: 'newPrice', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `item:Item = Item.allInstances()->any(i:Item | i.Barcode = barcode)`,
    precondition: `item.oclIsUndefined() = false`,
    postcondition: `
item.Price = newPrice and
result = true`,
  }),
];

const service = new Service({
  name: 'CoCoMESystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'changePrice',
  description: 'The store manager changes the price of item',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
