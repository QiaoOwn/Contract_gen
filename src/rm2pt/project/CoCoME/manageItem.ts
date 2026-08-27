import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Administrator} from './actor';

const actors = [Administrator];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'createItem',
    description: `Definition: The createItem operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'barcode', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'price', type: 'Real'}),
      new Parameter({name: 'stocknumber', type: 'Integer'}),
      new Parameter({name: 'orderprice', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `item:Item = Item.allInstances()->any(ite:Item | ite.Barcode = barcode)`,
    precondition: `item.oclIsUndefined() = true`,
    postcondition: `
let ite:Item in
ite.oclIsNew() and
ite.Barcode = barcode and
ite.Name = name and
ite.Price = price and
ite.StockNumber = stocknumber and
ite.OrderPrice = orderprice and
Item.allInstances()->includes(ite) and
result = true`,
  }),
  new Operation({
    name: 'queryItem',
    description: `Definition: The queryItem operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'barcode', type: 'Integer'})],
    returnType: new ReturnedType('Item'),
    definition: `item:Item = Item.allInstances()->any(ite:Item | ite.Barcode = barcode)`,
    precondition: `item.oclIsUndefined() = false`,
    postcondition: `result = item`,
  }),
  new Operation({
    name: 'modifyItem',
    description: `Definition: The modifyItem operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'barcode', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'price', type: 'Real'}),
      new Parameter({name: 'stocknumber', type: 'Integer'}),
      new Parameter({name: 'orderprice', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `item:Item = Item.allInstances()->any(ite:Item | ite.Barcode = barcode)`,
    precondition: `item.oclIsUndefined() = false`,
    postcondition: `
item.Barcode = barcode and
item.Name = name and
item.Price = price and
item.StockNumber = stocknumber and
item.OrderPrice = orderprice and
result = true`,
  }),
  new Operation({
    name: 'deleteItem',
    description: `Definition: The deleteItem operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'barcode', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `item:Item = Item.allInstances()->any(ite:Item | ite.Barcode = barcode)`,
    precondition: `
item.oclIsUndefined() = false and
Item.allInstances()->includes(item)`,
    postcondition: `
Item.allInstances()->excludes(item) and
result = true`,
  }),
];

const service = new Service({
  name: 'ManageItemCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageItem',
  description:
    'The administrator manages item information, including entering, inquiring, modifying and deleting of item information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
