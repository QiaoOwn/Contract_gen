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
    name: 'createCashier',
    description: `Definition: The createCashier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `cashier:Cashier = Cashier.allInstances()->any(cas:Cashier | cas.Id = id)`,
    precondition: `cashier.oclIsUndefined() = true`,
    postcondition: `
let cas:Cashier in
cas.oclIsNew() and
cas.Id = id and
cas.Name = name and
Cashier.allInstances()->includes(cas) and
result = true`,
  }),
  new Operation({
    name: 'queryCashier',
    description: `Definition: The queryCashier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Cashier'),
    definition: `cashier:Cashier = Cashier.allInstances()->any(cas:Cashier | cas.Id = id)`,
    precondition: `cashier.oclIsUndefined() = false`,
    postcondition: `result = cashier`,
  }),
  new Operation({
    name: 'modifyCashier',
    description: `Definition: The modifyCashier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `cashier:Cashier = Cashier.allInstances()->any(cas:Cashier | cas.Id = id)`,
    precondition: `cashier.oclIsUndefined() = false`,
    postcondition: `
cashier.Id = id and
cashier.Name = name and
result = true`,
  }),
  new Operation({
    name: 'deleteCashier',
    description: `Definition: The deleteCashier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `cashier:Cashier = Cashier.allInstances()->any(cas:Cashier | cas.Id = id)`,
    precondition: `
cashier.oclIsUndefined() = false and
Cashier.allInstances()->includes(cashier)`,
    postcondition: `
Cashier.allInstances()->excludes(cashier) and
result = true`,
  }),
];

const service = new Service({
  name: 'ManageCashierCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageCashier',
  description:
    'The administrator manages cashier information, including entering, inquiring, modifying and deleting of cashier information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
