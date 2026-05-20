// usecases/openStore.js

import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {TempVariable} from '../../model/TempVariable';
import {UseCase} from '../../model/UseCase';
import {StoreManager} from './actor';

const actors = [StoreManager];

const tempVariables = [new TempVariable({name: 'CurrentStore', type: 'Store'})];

const operations = [
  new Operation({
    name: 'openStore',
    description: `Definition: The openStore operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'storeID', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `sto:Store = Store.allInstance()->any(s:Store | s.Id = storeID)`,
    precondition: `
sto.oclIsUndefined() = false and
sto.IsOpened = false`,
    postcondition: `
self.CurrentStore = sto and
sto.IsOpened = true and
result = true`,
  }),
];

const service = new Service({
  name: 'CoCoMESystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'openStore',
  description: 'The store manager opens the store',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
