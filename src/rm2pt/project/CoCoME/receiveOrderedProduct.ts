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
    name: 'receiveOrderedProduct',
    description: `Definition: The receiveOrderedProduct operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'orderID', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `op:OrderProduct = OrderProduct.allInstances()->any(i:OrderProduct | i.Id = orderID)`,
    precondition: `op.oclIsUndefined() = false`,
    postcondition: `
op.OrderStatus = OrderStatus::RECEIVED and
op.ContainedEntries->forAll(oe:OrderEntry |
  oe.Item.StockNumber = oe.Item.StockNumber@pre + oe.Quantity)
and
result = true`,
  }),
];

const service = new Service({
  name: 'CoCoMESystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'receiveOrderedProduct',
  description: 'The store manager receives the order for purchase',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
