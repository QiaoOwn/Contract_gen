import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Scheduler} from './actor';

const actors = [Scheduler];

const tempVariables: TempVariable[] = [];

const operations: Operation[] = [
  // new Operation({
  //   name: 'generateStandardPaymentNotice',
  //   returnType: new ReturnedType('Boolean'),
  //   description: `find all the loans with the status is ls open and today after 3 days is after the loan current over due date,
  //   if the loans exist,
  //   send email to all these loans refered request email with the title "OverDueSoon" and the content "You account is OverDueSoon"`,
  //   definition: `loans:Set(Loan) = Loan.allInstances()->select(loa:Loan | loa.Status = LoanStatus::LSOPEN and Today.After(3).isAfter(loa.CurrentOverDueDate))`,
  //   precondition: `loans.oclIsUndefined() = false`,
  //   postcondition: `loans->forAll(l:Loan |
  // 			sendEmail(l.ReferedLoanRequest.Email, "OverDueSoon", "You account is OverDueSoon"))
  // 		and
  // 		result = true`,
  // }),
];

const service = new Service({
  name: 'LoanProcessingSystemSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'generateStandardPaymentNotice',
  description:
    'when the monthly billing time occurs, the loan system genereates the bill statements for mailing to the customer',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
