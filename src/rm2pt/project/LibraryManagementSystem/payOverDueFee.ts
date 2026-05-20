import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Librarian} from './actor';

const actors = [Librarian];

const operations = [
  new Operation({
    name: 'payOverDueFee',
    description: `Definition: The payOverDueFee operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'uid', type: 'String'}),
      new Parameter({name: 'fee', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `user:User = User.allInstance()->any(u:User | u.UserID = uid),
			loans:Set(Loan) = Loan.allInstance()->select(l:Loan | l.LoanedUser = user and l.DueDate.isBefore(Today)and l.IsReturned = true and l.OverDueFee > 0)`,
    precondition: `user.oclIsUndefined() = false and
			loans.notEmpty() and
			fee >= user.OverDueFee`,
    postcondition: `user.OverDueFee = 0 and
			loans->forAll(l:Loan |
				l.OverDueFee = 0)
			and
			result = true`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'payOverDueFee',
  description:
    'The librarian processes the payment of overdue fees for a user, reducing their outstanding balance.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
