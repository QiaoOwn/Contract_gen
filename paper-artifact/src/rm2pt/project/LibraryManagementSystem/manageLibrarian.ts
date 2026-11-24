import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Administrator} from './actor';

const actors = [Administrator];

const operations = [
  new Operation({
    name: 'createLibrarian',
    description: `Definition: The createLibrarian operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'librarianid', type: 'String'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'password', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `librarian:Librarian = Librarian.allInstances()->any(lib:Librarian | lib.LibrarianID = librarianid)`,
    precondition: `librarian.oclIsUndefined() = true`,
    postcondition: `
    let lib:Librarian in
    lib.oclIsNew() and
    lib.LibrarianID = librarianid and
    lib.Name = name and
    lib.Password = password and
    Librarian.allInstances()->includes(lib) and
    result = true`,
  }),
  // Similar operations for queryLibrarian, modifyLibrarian, deleteLibrarian
];

const service = new Service({
  name: 'ManageLibrarianCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageLibrarian',
  description:
    'The administrator manages librarian information, including entering, inquiring, modifying, and deleting librarian information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
