import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Administrator} from './actor';
import {Parameter} from '@/rm2pt/model/Parameter';
import {ReturnedType} from '@/rm2pt/model/ReturnedType';

const actors = [Administrator];

const operations = [
  new Operation({
    name: 'listRecommendBook',
    description: `Definition: The listRecommendBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'uid', type: 'String'})],
    returnType: new ReturnedType('Set(RecommendBook)'),
    definition: `user:User = User.allInstance()->any(u:User | u.UserID = uid),
     rBooks:Set(RecommendBook) = user.RecommendedBook`,
    precondition: `user.oclIsUndefined() = false and rBooks.oclIsUndefined() = false`,
    postcondition: `result = rBooks`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'listRecommendBook',
  description: 'The administrator views books recommended by users',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
