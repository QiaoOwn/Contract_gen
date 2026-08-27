import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {TempVariable} from '../../model/TempVariable';
import {UseCase} from '../../model/UseCase';
import {LoanAssistant} from './actor';

const actors = [LoanAssistant];

const tempVariables = [
  new TempVariable({name: 'CurrentLoanRequest', type: 'LoanRequest'}),
  new TempVariable({
    name: 'CurrentLoanRequests',
    type: 'Set(LoanRequest)',
  }),
];

const operations = [
  new Operation({
    name: 'listSubmitedLoanRequest',
    description: `Definition: The listSubmitedLoanRequest operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Set(LoanRequest)'),
    definition:
      'rs:Set(LoanRequest) = LoanRequest.allInstances()->select(r:LoanRequest | r.Status =  LoanRequestStatus::SUBMITTED)',
    precondition: 'rs.size() > 0',
    postcondition: `self.CurrentLoanRequests = rs and
			result = rs`,
  }),
  new Operation({
    name: 'chooseLoanRequest',
    description: `Definition: The chooseLoanRequest operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'requestid', type: 'Integer'})],
    returnType: new ReturnedType('LoanRequest'),
    definition:
      'rs:LoanRequest = self.CurrentLoanRequests->any(r:LoanRequest | r.RequestID = requestid)',
    precondition: 'rs.oclIsUndefined() = false',
    postcondition: 'self.CurrentLoanRequest = rs and result = rs',
  }),
  new Operation({
    name: 'markRequestValid',
    description: `Definition: The markRequestValid operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Boolean'),
    precondition: `self.CurrentLoanRequest.oclIsUndefined() = false`,
    postcondition: `self.CurrentLoanRequest.Status = LoanRequestStatus::REFERENCESVALIDATED and
			result = true`,
  }),
];

const service = new Service({
  name: 'EnterValidatedCreditReferencesModule',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'enterValidatedCreditReferences',
  description: 'The loan assistant find the submitted requests and mark it as references validated',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
