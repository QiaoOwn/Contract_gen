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
    name: 'closeOutLoan',
    description: `Definition: The closeOutLoan operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'loanid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `loan:Loan = Loan.allInstance()->any(loa:Loan | loa.LoanID = loanid)`,
    precondition: `loan.oclIsUndefined() = false and
			loan.Status = LoanStatus::LSOPEN`,
    postcondition: `loan.Status = LoanStatus::CLOSED and
			result = true`,
  }),
];

const service = new Service({
  name: 'LoanProcessingSystemSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'closeOutLoan',
  description: 'The loan has been paid in full by the customer, and the loan will be closed',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
