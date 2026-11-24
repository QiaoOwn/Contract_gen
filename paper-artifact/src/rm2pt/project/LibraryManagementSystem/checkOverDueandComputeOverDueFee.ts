import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Scheduler} from './actor';

const actors = [Scheduler];

const operations: Operation[] = [
  //   new Operation({
  //     name: 'checkOverDueandComputeOverDueFee',
  //     description:
  //       'The scheduler checks all loan records to determine if any books are overdue and calculates the corresponding overdue fee.',
  //     definition: `loans:Set(Loan) = Loan.allInstances()->select(loan:Loan | loan.IsReturned = false and loan.DueDate.isBefore(Today))`,
  //     precondition: `true`,
  //     postcondition: `loans->forAll(loan:Loan |
  // 				loan.IsReturned = false and
  // 				if
  // 					Today.Before(3).isAfter(loan.DueDate) and
  // 					loan.OverDue3Days = false
  // 				then
  // 					loan.LoanedUser.BorrowStatus = BorrowStatus::SUSPEND and
  // 					sendNotificationEmail(loan.LoanedUser.Email) and
  // 					loan.OverDue3Days = true
  // 				endif and
  // 				if
  // 					Today.Before(10).isAfter(loan.DueDate) and
  // 					loan.OverDue10Days = false
  // 				then
  // 					loan.LoanedUser.SuspensionDays = loan.LoanedUser.SuspensionDays@pre + 14 and
  // 					sendNotificationEmail(loan.LoanedUser.Email) and
  // 					loan.OverDue10Days = true
  // 				endif and
  // 				if
  // 					Today.Before(17).isAfter(loan.DueDate) and
  // 					loan.OverDue17Days = false
  // 				then
  // 					loan.LoanedUser.SuspensionDays = loan.LoanedUser.SuspensionDays@pre + 30 and
  // 					sendNotificationEmail(loan.LoanedUser.Email) and
  // 					loan.OverDue17Days = true
  // 				endif and
  // 				if
  // 					Today.Before(31).isAfter(loan.DueDate) and
  // 					loan.OverDue31Days = false
  // 				then
  // 					loan.OverDueFee = 60 and
  // 					sendNotificationEmail(loan.LoanedUser.Email) and
  // 					loan.OverDue31Days = true and
  // 					loan.LoanedUser.OverDueFee = loan.LoanedUser.OverDueFee@pre + loan.OverDueFee
  // 				endif
  // 			)`,
  //   }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'checkOverDueandComputeOverDueFee',
  description:
    'The scheduler checks for overdue books and calculates overdue fees for all users with late returns.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
