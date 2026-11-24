import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {TempVariable} from '../../model/TempVariable';
import {UseCase} from '../../model/UseCase';
import {LoanClerk} from './actor';

const actors = [LoanClerk];

const tempVariables = [
  new TempVariable({name: 'CurrentApprovalLetter', type: 'ApprovalLetter'}),
  new TempVariable({
    name: 'CurrentLoanAgreement',
    type: 'LoanAgreement',
  }),
  new TempVariable({
    name: 'CurrentLoanRequest',
    type: 'LoanRequest',
  }),
  new TempVariable({
    name: 'CurrentLoanRequests',
    type: 'Set(LoanRequest)',
  }),
];

const operations = [
  new Operation({
    name: 'listApprovalRequest',
    description: `Definition: The listApprovalRequest operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Set(LoanRequest)'),
    definition:
      'rs:Set(LoanRequest) = LoanRequest.allInstances()->select(r:LoanRequest | r.Status =  LoanRequestStatus::APPROVED)',
    precondition: 'rs.oclIsUndefined() = false',
    postcondition: 'self.CurrentLoanRequests = rs and result = rs',
  }),
  new Operation({
    name: 'genereateApprovalLetter',
    description: `Definition: The genereateApprovalLetter operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'id', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition:
      'r:LoanRequest = LoanRequest.allInstances()->any(lr:LoanRequest | lr.RequestID = id)',
    precondition: 'r.oclIsUndefined() = false',
    postcondition: `let l:ApprovalLetter in
			l.oclIsNew() and
			l.Content = "ApprovalLetterContent" and
			r.AttachedApprovalLetter = l and
			self.CurrentLoanRequest = r and
			ApprovalLetter.allInstances()->includes(l) and
			result = true`,
  }),
  // new Operation({
  //   name: 'emailToAppliant',
  //   description: `if the current loan request exist, then send the email to the appliant and tell "Your Loan Request was approved"`,
  //   returnType: new ReturnedType('Boolean'),
  //   precondition: 'self.CurrentLoanRequest.oclIsUndefined() = false',
  //   postcondition: `sendEmail(self.CurrentLoanRequest.Email, self.CurrentLoanRequest.Name, "Your Loan Request was approved") and
  // 		result = true`,
  // }),

  new Operation({
    name: 'generateLoanAgreement',
    description: `Definition: The generateLoanAgreement operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Boolean'),
    precondition: 'self.CurrentLoanRequest.oclIsUndefined() = false',
    postcondition: `let la:LoanAgreement in
			la.oclIsNew() and
			la.Content = "Loan Agreement" and
			self.CurrentLoanRequest.AttachedLoanAgreement = la and
			LoanAgreement.allInstances()->includes(la) and
			result = true`,
  }),
  // new Operation({
  //   name: 'printLoanAgreement',
  //   parameters: [new Parameter({name: 'number', type: 'Integer'})],
  //   description: `if current loan request exist, then print the current loan request with the attached loan agreement and the number`,
  //   returnType: new ReturnedType('Boolean'),
  //   precondition: 'self.CurrentLoanRequest.oclIsUndefined() = false',
  //   postcondition: `print(CurrentLoanRequest.AttachedLoanAgreement.Content, number) and
  // 		result = true`,
  // }),
  new Operation({
    name: 'createLoanAccount',
    description: `Definition: The createLoanAccount operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'loanaccountid', type: 'Integer'}),
      new Parameter({name: 'balance', type: 'Real'}),
      new Parameter({
        name: 'status',
        type: 'LoanAccountStatus[NORMAL|HASPAIDINFULL]',
      }),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `loanaccount:LoanAccount = LoanAccount.allInstances()->any(loa:LoanAccount | loa.LoanAccountID = loanaccountid)`,
    precondition: `loanaccount.oclIsUndefined() = true`,
    postcondition: `let loa:LoanAccount in
			loa.oclIsNew() and
			loa.LoanAccountID = loanaccountid and
			loa.Balance = balance and
			loa.Status = status and
			LoanAccount.allInstances()->includes(loa) and
			result = true`,
  }),
];

const service = new Service({
  name: 'GenerateLoanLetterAndAgreementModule',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'generateLoanLetterAndAgreement',
  description: 'a loan clerk has the system genereate an approval letter for the applicant',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
