// manageUser.js
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {BankClerk} from './actor';

const actors = [BankClerk];

const operations = [
  new Operation({
    name: 'createUser',
    description: `Definition: The createUser operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'userid', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'address', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
      user:User = User.allInstance()->any(use:User | use.UserID = userid)
    `,
    precondition: `
      user.oclIsUndefined() = true
    `,
    postcondition: `
      let use:User in
      use.oclIsNew() and
      use.UserID = userid and
      use.Name = name and
      use.Address = address and
      User.allInstance()->includes(use) and
      result = true
    `,
  }),
  new Operation({
    name: 'queryUser',
    description: `Definition: The queryUser operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'userid', type: 'Integer'})],
    returnType: new ReturnedType('User'),
    definition: `
      user:User = User.allInstance()->any(use:User | use.UserID = userid)
    `,
    precondition: `
      user.oclIsUndefined() = false
    `,
    postcondition: `
      result = user
    `,
  }),
  new Operation({
    name: 'modifyUser',
    description: `Definition: The modifyUser operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'userid', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'address', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
      user:User = User.allInstance()->any(use:User | use.UserID = userid)
    `,
    precondition: `
      user.oclIsUndefined() = false
    `,
    postcondition: `
        user.UserID = userid and
        user.Name = name and
        user.Address = address and
        result = true
    `,
  }),
  new Operation({
    name: 'deleteUser',
    description: `Definition: The deleteUser operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'userid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `
      user:User = User.allInstance()->any(use:User | use.UserID = userid)
    `,
    precondition: `
     user.oclIsUndefined() = false
    `,
    postcondition: `
      User.allInstance()->excludes(user) and
	  result = true
    `,
  }),
];

const service = new Service({
  name: 'ManageUserCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageUser',
  description:
    'The bank clerk manages user information, including entering, inquiring, modifying and deleting of user information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
