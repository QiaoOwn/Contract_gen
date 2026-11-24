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
    name: 'createUser',
    description: `Definition: The createUser operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'userid', type: 'String'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'sex', type: 'Sex [M|F]'}),
      new Parameter({name: 'password', type: 'String'}),
      new Parameter({name: 'email', type: 'String'}),
      new Parameter({name: 'faculty', type: 'String'}),
      new Parameter({name: 'loanednumber', type: 'Integer'}),
      new Parameter({
        name: 'borrowstatus',
        type: 'BorrowStatus [NORMAL|SUSPEND]',
      }),
      new Parameter({name: 'suspensiondays', type: 'Integer'}),
      new Parameter({name: 'overduefee', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `user:User = User.allInstances()->any(use:User | use.UserID = userid)`,
    precondition: `user.oclIsUndefined() = true`,
    postcondition: `
    let use:User in
    use.oclIsNew() and
    use.UserID = userid and
    use.Name = name and
    use.Sex = sex and
    use.Password = password and
    use.Email = email and
    use.Faculty = faculty and
    use.LoanedNumber = loanednumber and
    use.BorrowStatus = borrowstatus and
    use.SuspensionDays = suspensiondays and
    use.OverDueFee = overduefee and
    User.allInstances()->includes(use) and
    result = true`,
  }),
  // Similar operations for queryUser, modifyUser, deleteUser, createStudent, createFaculty, modifyStudent, modifyFaculty
];

const service = new Service({
  name: 'ManageUserCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageUser',
  description:
    'The administrator manages user information, including entering, inquiring, modifying, and deleting user information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
