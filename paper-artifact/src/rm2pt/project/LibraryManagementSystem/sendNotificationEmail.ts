import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {ThirdPartSystem} from './actor';

const actors = [ThirdPartSystem];

const operations = [
  new Operation({
    name: 'sendNotificationEmail',
    description: `Definition: The sendNotificationEmail operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'email', type: 'String'})],
    returnType: new ReturnedType('Boolean'),
    precondition: `email <> ""`,
    postcondition: `result = true`,
  }),
];

const service = new Service({
  name: 'ThirdPartyServices',
  operations,
});

const useCase = new UseCase({
  name: 'sendNotificationEmail',
  description: 'The third-party system sends notification email',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
