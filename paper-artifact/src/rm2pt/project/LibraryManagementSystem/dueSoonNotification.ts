import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Scheduler} from './actor';

const actors = [Scheduler];

const operations: Operation[] = [
  // new Operation({
  //   name: 'dueSoonNotification',
  //   description:
  //     'The scheduler sends notifications to users whose borrowed books are due to be returned soon.',
  //   definition: `users:Set(User) = User.allInstances()->select(user:User | user.LoanedBook->exists(loan:Loan | loan.IsReturned = false and Today.After(3).isAfter(loan.DueDate)))`,
  //   precondition: `true`,
  //   postcondition: `users->forAll(u:User |
  // 			sendNotificationEmail(u.Email))`,
  // }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'dueSoonNotification',
  description:
    'The scheduler sends notifications to users with books due to be returned within the next three days.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
