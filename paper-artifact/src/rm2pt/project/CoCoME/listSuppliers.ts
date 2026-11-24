// usecases/listSuppliers.js

import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {StoreManager} from './actor';

const actors = [StoreManager];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'listSuppliers',
    description: `Definition: The listSuppliers operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Set(Supplier)'),
    precondition: `true`,
    postcondition: `result = Supplier.allInstances()`,
  }),
];

const service = new Service({
  name: 'CoCoMESystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'listSuppliers',
  description: 'The store manager views all suppliers',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
