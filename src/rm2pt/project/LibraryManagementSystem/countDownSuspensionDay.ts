import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Scheduler} from './actor';

const actors = [Scheduler];

const operations = [
  new Operation({
    name: 'countDownSuspensionDay',
    description: `Definition: The countDownSuspensionDay operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    definition: `users:Set(User) = User.allInstance()->select(u:User | u.SuspensionDays > 0)`,
    precondition: `true`,
    postcondition: `users->forAll(u:User |
				u.SuspensionDays = u.SuspensionDays@pre - 1 and
				if
					u.BorrowStatus = BorrowStatus::SUSPEND and
					u.OverDueFee = 0 and
					u.SuspensionDays = 0
				then
					u.BorrowStatus = BorrowStatus::NORMAL
				endif
			)`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'countDownSuspensionDay',
  description:
    'The scheduler decreases the suspension days for users with overdue books, and suspends their borrowing privileges once the days run out.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
