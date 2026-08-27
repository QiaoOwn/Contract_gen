import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {LoanOfficer} from './actor';

const actors = [LoanOfficer];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'createLoanTerm',
    description: `Definition: The createLoanTerm operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'itemid', type: 'Integer'}),
      new Parameter({name: 'content', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition:
      'loanterm:LoanTerm = LoanTerm.allInstances()->any(loa:LoanTerm | loa.ItemID = itemid)',
    precondition: 'loanterm.oclIsUndefined() = true',
    postcondition: `let loa:LoanTerm in
			loa.oclIsNew() and
			loa.ItemID = itemid and
			loa.Content = content and
			LoanTerm.allInstances()->includes(loa) and
			result = true`,
  }),
  new Operation({
    name: 'queryLoanTerm',
    description: `Definition: The queryLoanTerm operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'itemid', type: 'Integer'})],
    returnType: new ReturnedType('LoanTerm'),
    definition: `loanterm:LoanTerm = LoanTerm.allInstances()->any(loa:LoanTerm | loa.ItemID = itemid)`,
    precondition: `loanterm.oclIsUndefined() = false`,
    postcondition: `result = loanterm`,
  }),
  new Operation({
    name: 'modifyLoanTerm',
    description: `Definition: The modifyLoanTerm operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'itemid', type: 'Integer'}),
      new Parameter({name: 'content', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `loanterm:LoanTerm = LoanTerm.allInstances()->any(loa:LoanTerm | loa.ItemID = itemid)`,
    precondition: `loanterm.oclIsUndefined() = false`,
    postcondition: `loanterm.ItemID = itemid and
			loanterm.Content = content and
			result = true`,
  }),
  new Operation({
    name: 'deleteLoanTerm',
    description: `Definition: The deleteLoanTerm operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'itemid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `loanterm:LoanTerm = LoanTerm.allInstances()->any(loa:LoanTerm | loa.ItemID = itemid)`,
    precondition: `loanterm.oclIsUndefined() = false`,
    postcondition: `LoanTerm.allInstances()->excludes(loanterm) and
			result = true`,
  }),
];

const service = new Service({
  name: 'ManageLoanTermCRUDService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageLoanTerm',
  description: 'get, create, update, delete loan terms',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
