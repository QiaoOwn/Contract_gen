import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {TempVariable} from '../../model/TempVariable';
import {UseCase} from '../../model/UseCase';
import {LoanOfficer} from './actor';

const actors = [LoanOfficer];

const tempVariables = [
  new TempVariable({name: 'CurrentLoanRequest', type: 'LoanRequest'}),
  new TempVariable({
    name: 'CurrentLoanRequests',
    type: 'Set(LoanRequest)',
  }),
];

const operations = [
  new Operation({
    name: 'listTenLoanRequest',
    description: `Definition: The listTenLoanRequest operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Set(LoanRequest)'),
    definition:
      'rs:Set(LoanRequest) = LoanRequest.allInstances()->select(r:LoanRequest | r.Status =  LoanRequestStatus::REFERENCESVALIDATED)',
    precondition: 'rs.oclIsUndefined() = false',
    postcondition: 'self.CurrentLoanRequests = rs and result = rs',
  }),
  new Operation({
    name: 'chooseOneForReview',
    description: `Definition: The chooseOneForReview operation handles its intended business action in this system.
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
    name: 'checkCreditHistory',
    description: `Definition: The checkCreditHistory operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('CreditHistory'),
    precondition: `self.CurrentLoanRequest.oclIsUndefined() = false and
			CurrentLoanRequest.RequestedCreditHistory.oclIsUndefined() = false`,
    postcondition: `result = CurrentLoanRequest.RequestedCreditHistory`,
  }),
  new Operation({
    name: 'reviewCheckingAccount',
    description: `Definition: The reviewCheckingAccount operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('CheckingAccount'),
    precondition: `self.CurrentLoanRequest.oclIsUndefined() = false and
			CurrentLoanRequest.RequestedCAHistory.oclIsUndefined() = false`,
    postcondition: `result = CurrentLoanRequest.RequestedCAHistory`,
  }),
  new Operation({
    name: 'listAvaiableLoanTerm',
    description: `Definition: The listAvaiableLoanTerm operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Set(LoanTerm)'),
    precondition: `true`,
    postcondition: `result = LoanTerm.allInstances()`,
  }),
  new Operation({
    name: 'addLoanTerm',
    description: `Definition: The addLoanTerm operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'termid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `loanterm:LoanTerm = LoanTerm.allInstances()->any(loa:LoanTerm | loa.ItemID = termid)`,
    precondition: `self.CurrentLoanRequest.oclIsUndefined() = false and
			loanterm.oclIsUndefined() = false`,
    postcondition: `CurrentLoanRequest.AttachedLoanTerms->includes(loanterm) and
			result = true`,
  }),
  new Operation({
    name: 'approveLoanRequest',
    description: `Definition: The approveLoanRequest operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Boolean'),
    precondition: `self.CurrentLoanRequest.oclIsUndefined() = false`,
    postcondition: `self.CurrentLoanRequest.Status = LoanRequestStatus::APPROVED and
			result = true`,
  }),
];

const service = new Service({
  name: 'EvaluateLoanRequestModule',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'evaluateLoanRequest',
  description:
    'The loan officer reviews the online information about the pending loan request to determine whether the loan should be approved',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
