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
    name: 'createProductCatalog',
    description: `Definition: The createProductCatalog operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `productcatalog:ProductCatalog = ProductCatalog.allInstance()->any(pro:ProductCatalog | pro.Id = id)`,
    precondition: `productcatalog.oclIsUndefined() = true`,
    postcondition: `
let pro:ProductCatalog in
pro.oclIsNew() and
pro.Id = id and
pro.Name = name and
ProductCatalog.allInstance()->includes(pro) and
result = true`,
  }),
  new Operation({
    name: 'queryProductCatalog',
    description: `Definition: The queryProductCatalog operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('ProductCatalog'),
    definition: `productcatalog:ProductCatalog = ProductCatalog.allInstance()->any(pro:ProductCatalog | pro.Id = id)`,
    precondition: `productcatalog.oclIsUndefined() = false`,
    postcondition: `result = productcatalog`,
  }),
  new Operation({
    name: 'modifyProductCatalog',
    description: `Definition: The modifyProductCatalog operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `productcatalog:ProductCatalog = ProductCatalog.allInstance()->any(pro:ProductCatalog | pro.Id = id)`,
    precondition: `productcatalog.oclIsUndefined() = false`,
    postcondition: `
productcatalog.Id = id and
productcatalog.Name = name and
result = true`,
  }),
  new Operation({
    name: 'deleteProductCatalog',
    description: `Definition: The deleteProductCatalog operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `productcatalog:ProductCatalog = ProductCatalog.allInstance()->any(pro:ProductCatalog | pro.Id = id)`,
    precondition: `
productcatalog.oclIsUndefined() = false and
ProductCatalog.allInstance()->includes(productcatalog)`,
    postcondition: `
ProductCatalog.allInstance()->excludes(productcatalog) and
result = true`,
  }),
];

const service = new Service({
  name: 'ManageProductCatalogCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageProductCatalog',
  description:
    'The administrator manages catalogues of items, including entering, inquiring, modifying and deleting of catalogue information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
