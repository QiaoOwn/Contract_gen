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
    name: 'createSubject',
    description: `Definition: The createSubject operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'name', type: 'String'})],
    returnType: new ReturnedType('Boolean'),
    definition: `subject:Subject = Subject.allInstance()->any(sub:Subject | sub.Name = name)`,
    precondition: `subject.oclIsUndefined() = true`,
    postcondition: `
    let sub:Subject in
    sub.oclIsNew() and
    sub.Name = name and
    Subject.allInstance()->includes(sub) and
    result = true`,
  }),
  // Similar operations for querySubject, modifySubject, deleteSubject
];

const service = new Service({
  name: 'ManageSubjectCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageSubject',
  description:
    'The administrator manages subject information, including entering, inquiring, modifying, and deleting subject information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
