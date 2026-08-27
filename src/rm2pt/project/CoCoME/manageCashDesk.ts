// usecases/manageCashDesk.js

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
    name: 'createCashDesk',
    description: `Definition: The createCashDesk operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'isopened', type: 'Boolean'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `cashdesk:CashDesk = CashDesk.allInstances()->any(cas:CashDesk | cas.Id = id)`,
    precondition: `cashdesk.oclIsUndefined() = true`,
    postcondition: `
let cas:CashDesk in
cas.oclIsNew() and
cas.Id = id and
cas.Name = name and
cas.IsOpened = isopened and
CashDesk.allInstances()->includes(cas) and
result = true`,
  }),
  new Operation({
    name: 'queryCashDesk',
    description: `Definition: The queryCashDesk operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('CashDesk'),
    definition: `cashdesk:CashDesk = CashDesk.allInstances()->any(cas:CashDesk | cas.Id = id)`,
    precondition: `cashdesk.oclIsUndefined() = false`,
    postcondition: `result = cashdesk`,
  }),
  new Operation({
    name: 'modifyCashDesk',
    description: `Definition: The modifyCashDesk operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'isopened', type: 'Boolean'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `cashdesk:CashDesk = CashDesk.allInstances()->any(cas:CashDesk | cas.Id = id)`,
    precondition: `cashdesk.oclIsUndefined() = false`,
    postcondition: `
cashdesk.Id = id and
cashdesk.Name = name and
cashdesk.IsOpened = isopened and
result = true`,
  }),
  new Operation({
    name: 'deleteCashDesk',
    description: `Definition: The deleteCashDesk operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `cashdesk:CashDesk = CashDesk.allInstances()->any(cas:CashDesk | cas.Id = id)`,
    precondition: `
cashdesk.oclIsUndefined() = false and
CashDesk.allInstances()->includes(cashdesk)`,
    postcondition: `
CashDesk.allInstances()->excludes(cashdesk) and
result = true`,
  }),
];

const service = new Service({
  name: 'ManageCashDeskCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageCashDesk',
  description:
    'The administrator manages cash desk information, including entering, inquiring, modifying and deleting of cash desk information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
