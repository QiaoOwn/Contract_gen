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
    name: 'createStore',
    description: `Definition: The createStore operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'address', type: 'String'}),
      new Parameter({name: 'isopened', type: 'Boolean'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `store:Store = Store.allInstances()->any(sto:Store | sto.Id = id)`,
    precondition: `store.oclIsUndefined() = true`,
    postcondition: `
let sto:Store in
sto.oclIsNew() and
sto.Id = id and
sto.Name = name and
sto.Address = address and
sto.IsOpened = isopened and
Store.allInstances()->includes(sto) and
result = true`,
  }),
  new Operation({
    name: 'queryStore',
    description: `Definition: The queryStore operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Store'),
    definition: `store:Store = Store.allInstances()->any(sto:Store | sto.Id = id)`,
    precondition: `store.oclIsUndefined() = false`,
    postcondition: `result = store`,
  }),
  new Operation({
    name: 'modifyStore',
    description: `Definition: The modifyStore operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'address', type: 'String'}),
      new Parameter({name: 'isopened', type: 'Boolean'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `store:Store = Store.allInstances()->any(sto:Store | sto.Id = id)`,
    precondition: `store.oclIsUndefined() = false`,
    postcondition: `
store.Id = id and
store.Name = name and
store.Address = address and
store.IsOpened = isopened and
result = true`,
  }),
  new Operation({
    name: 'deleteStore',
    description: `Definition: The deleteStore operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `store:Store = Store.allInstances()->any(sto:Store | sto.Id = id)`,
    precondition: `
store.oclIsUndefined() = false and
Store.allInstances()->includes(store)`,
    postcondition: `
Store.allInstances()->excludes(store) and
result = true`,
  }),
];

const service = new Service({
  name: 'ManageStoreCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageStore',
  description:
    'The administrator manages store information, including entering, inquiring, modifying and deleting of store information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
