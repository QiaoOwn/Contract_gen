import {TempVariable} from '../../model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Applicant} from './actor';

const actors = [Applicant];

const tempVariables = [new TempVariable({name: 'CurrentLoanRequest', type: 'LoanRequest'})];

const operations = [
  new Operation({
    name: 'enterLoanInformation',
    description: `Definition: The enterLoanInformation operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'requestid', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'loanamount', type: 'Real'}),
      new Parameter({name: 'loanpurpose', type: 'String'}),
      new Parameter({name: 'income', type: 'Real'}),
      new Parameter({name: 'phonenumber', type: 'Integer'}),
      new Parameter({name: 'postaladdress', type: 'String'}),
      new Parameter({name: 'zipcode', type: 'Integer'}),
      new Parameter({name: 'email', type: 'String'}),
      new Parameter({name: 'workreferences', type: 'String'}),
      new Parameter({name: 'creditreferences', type: 'String'}),
      new Parameter({name: 'checkingaccountnumber', type: 'Integer'}),
      new Parameter({name: 'securitynumber', type: 'Integer'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition:
      'loanrequest:LoanRequest = LoanRequest.allInstance()->any(loa:LoanRequest | loa.RequestID = requestid)',
    precondition: 'loanrequest.oclIsUndefined() = true',
    postcondition: `let loa:LoanRequest in
			loa.oclIsNew() and
			loa.RequestID = requestid and
			loa.Name = name and
			loa.LoanAmount = loanamount and
			loa.LoanPurpose = loanpurpose and
			loa.Income = income and
			loa.PhoneNumber = phonenumber and
			loa.PostalAddress = postaladdress and
			loa.ZipCode = zipcode and
			loa.Email = email and
			loa.WorkReferences = workreferences and
			loa.CreditReferences = creditreferences and
			loa.CheckingAccountNumber = checkingaccountnumber and
			loa.SecurityNumber = securitynumber and
			LoanRequest.allInstance()->includes(loa) and
			self.CurrentLoanRequest = loa and
			result = true`,
  }),
  // new Operation({
  //   name: 'creditRequest',
  //   description: `if the current loan request exists,
  //     make a new credit history using the getCreditHistory service with the current loan request security number and name,
  //     the current loan request requested credit history should be it`,
  //   returnType: new ReturnedType('Boolean'),
  //   precondition: `self.CurrentLoanRequest.oclIsUndefined() = false`,
  //   postcondition: `let his:CreditHistory in
  // 		his.oclIsNew() and
  // 		his = getCreditHistory(CurrentLoanRequest.SecurityNumber, CurrentLoanRequest.Name) and
  // 		CurrentLoanRequest.RequestedCreditHistory = his and
  // 		CreditHistory.allInstance()->includes(his) and
  // 		result = true`,
  // }),
  // new Operation({
  //   name: 'accountStatusRequest',
  //   description: `if the current loan request exists,
  //     make a new checking account action using the getCheckingAccountStatus service with the current loan request check account number,
  //     the current loan request requested ca history should be it`,
  //   returnType: new ReturnedType('Integer'),
  //   precondition: `self.CurrentLoanRequest.oclIsUndefined() = false`,
  //   postcondition: `let ca:CheckingAccount in
  // 		ca.oclIsNew() and
  // 		ca = getCheckingAccountStatus(self.CurrentLoanRequest.CheckingAccountNumber) and
  // 		self.CurrentLoanRequest.RequestedCAHistory = ca and
  // 		CheckingAccount.allInstance()->includes(ca) and
  // 		result = true`,
  // }),
  new Operation({
    name: 'calculateScore',
    description: `Definition: The calculateScore operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Integer'),
    precondition: `self.CurrentLoanRequest.oclIsUndefined() = false and
			CurrentLoanRequest.RequestedCAHistory.oclIsUndefined() = false and
			CurrentLoanRequest.RequestedCreditHistory.oclIsUndefined() = false`,
    postcondition: `self.CurrentLoanRequest.CreditScore = 100 and
			self.CurrentLoanRequest.Status = LoanRequestStatus::SUBMITTED and
			result = self.CurrentLoanRequest.CreditScore`,
  }),
];

const service = new Service({
  name: 'SubmitLoanRequestModule',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'submitLoanRequest',
  description: 'an applicant submit a loan request with the form',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
