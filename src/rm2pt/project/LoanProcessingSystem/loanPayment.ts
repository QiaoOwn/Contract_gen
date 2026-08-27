import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {LoanClerk} from './actor';

const actors = [LoanClerk];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'loanPayment',
    description: `Definition: The loanPayment operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'loanid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `loan:Loan = Loan.allInstances()->any(loa:Loan | loa.LoanID = loanid)`,
    precondition: `loan.oclIsUndefined() = false and
			loan.Status = LoanStatus::LSOPEN`,
    postcondition: `loan.RemainAmountToPay = loan.RemainAmountToPay@pre - loan.RepaymentAmount and
			result = true`,
  }),
];

const service = new Service({
  name: 'LoanProcessingSystemSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'loanPayment',
  description:
    'Payment is received from the customer, the loan clerk enters the payment into the appropriate loan account',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
