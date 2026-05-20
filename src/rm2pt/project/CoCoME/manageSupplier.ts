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
    name: 'createSupplier',
    description: `Definition: The createSupplier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `supplier:Supplier = Supplier.allInstance()->any(sup:Supplier | sup.Id = id)`,
    precondition: `supplier.oclIsUndefined() = true`,
    postcondition: `
let sup:Supplier in
sup.oclIsNew() and
sup.Id = id and
sup.Name = name and
Supplier.allInstance()->includes(sup) and
result = true`,
  }),
  new Operation({
    name: 'querySupplier',
    description: `Definition: The querySupplier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Supplier'),
    definition: `supplier:Supplier = Supplier.allInstance()->any(sup:Supplier | sup.Id = id)`,
    precondition: `supplier.oclIsUndefined() = false`,
    postcondition: `result = supplier`,
  }),
  new Operation({
    name: 'modifySupplier',
    description: `Definition: The modifySupplier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `supplier:Supplier = Supplier.allInstance()->any(sup:Supplier | sup.Id = id)`,
    precondition: `supplier.oclIsUndefined() = false`,
    postcondition: `
supplier.Id = id and
supplier.Name = name and
result = true`,
  }),
  new Operation({
    name: 'deleteSupplier',
    description: `Definition: The deleteSupplier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `supplier:Supplier = Supplier.allInstance()->any(sup:Supplier | sup.Id = id)`,
    precondition: `
supplier.oclIsUndefined() = false and
Supplier.allInstance()->includes(supplier)`,
    postcondition: `
Supplier.allInstance()->excludes(supplier) and
result = true`,
  }),
];

const service = new Service({
  name: 'ManageSupplierCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageSupplier',
  description:
    'The administrator manages supplier information, including entering, inquiring, modifying and deleting of supplier information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
