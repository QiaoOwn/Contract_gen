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
  //   name: 'generateLateNotice',
  //   returnType: new ReturnedType('Boolean'),
  //   description: `find all the loans with the status is ls open and today is after the loan current over due date,
  //   if the loans exist,
  //   send email to all these loans refered request email with the title ""OverDued"" and the content "You are overdued, please repayment ASAP"`,
  //   definition: `loans:Set(Loan) = Loan.allInstance()->select(loa:Loan | loa.Status = LoanStatus::LSOPEN and Today.isAfter(loa.CurrentOverDueDate))`,
  //   precondition: `loans.oclIsUndefined() = false`,
  //   postcondition: `loans->forAll(l:Loan |
  // 			sendEmail(l.ReferedLoanRequest.Email, "OverDued", "You are overdued, please repayment ASAP"))
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
  name: 'generateLateNotice',
  description: 'The loan system genereates the late notice for mailling to the customer',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
