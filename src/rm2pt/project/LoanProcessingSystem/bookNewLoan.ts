import {TempVariable} from '@/rm2pt/model/TempVariable';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {LoanClerk} from './actor';
import systemService from './systemService';

const actors = [LoanClerk];

const tempVariables: TempVariable[] = [];

const operations: Operation[] = [
  // new Operation({
  //   name: 'bookNewLoan',
  //   parameters: [
  //     new Parameter({name: 'requestid', type: 'Integer'}),
  //     new Parameter({name: 'loanid', type: 'Integer'}),
  //     new Parameter({name: 'accountid', type: 'Integer'}),
  //     new Parameter({name: 'startdate', type: 'Date'}),
  //     new Parameter({name: 'enddate', type: 'Date'}),
  //     new Parameter({name: 'repaymentdays', type: 'Integer'}),
  //   ],
  //   returnType: new ReturnedType('Boolean'),
  //   description: `find a loan with provided loan id and find loan request with provided loan request id and find loan account with provided loan account id
  //   then if the loan is not exist and loan request is exist,
  //   create a new loan and set the loan id queal to provided loan id and the start date is the provided start date and the end date is provided end date and set repayment days
  //   to provided value, and the loan status should be ls open and the repayment amount should be loan amount and the loan current over due date should equal to the start date after the repayment days
  //   and if the loan account is not exist create loan account with the provided account id and make it balance to the provided loan amount and the belonged loan account of the loan should be the new created loan account
  //   if the account exist then the account balance should be the previous balance plus the provided balance.
  //   After all these things done, transfer funds to the account id the loan request amount, and the loan remain amount to pay is the loan request amount,
  //   then the loan should be save in the system and the loan request's approve loan should be it, the loan's refered loan request is the loan request you find
  //   `,
  //   definition: `loan:Loan = Loan.allInstances()->any(loa:Loan | loa.LoanID = loanid),
  //      r:LoanRequest = LoanRequest.allInstances()->any(lr:LoanRequest | lr.RequestID = requestid),
  //      la:LoanAccount = LoanAccount.allInstances()->any(lacc:LoanAccount | lacc.LoanAccountID = accountid)`,
  //   precondition: `loan.oclIsUndefined() = true and
  // 		r.oclIsUndefined() = false`,
  //   postcondition: `let loa:Loan, lacc:LoanAccount in
  // 		loa.oclIsNew() and
  // 		loa.LoanID = loanid and
  // 		loa.StartDate = startdate and
  // 		loa.EndDate = enddate and
  // 		loa.RePaymentDays = repaymentdays and
  // 		loa.Status = LoanStatus::LSOPEN and
  // 		loa.RepaymentAmount = r.LoanAmount and
  // 		loa.CurrentOverDueDate = startdate.After(repaymentdays) and
  // 		if
  // 			la.oclIsUndefined() = true
  // 		then
  // 			lacc = createLoanAccount(accountid) and
  // 			LoanAccount.allInstances()->includes(lacc) and
  // 			lacc.Balance = r.LoanAmount and
  // 			loa.BelongedLoanAccount = lacc
  // 		else
  // 			la.Balance = la.Balance@pre + r.LoanAmount
  // 		endif and
  // 		transferFunds(accountid, r.LoanAmount) and
  // 		loa.RemainAmountToPay = r.LoanAmount and
  // 		Loan.allInstances()->includes(loa) and
  // 		r.ApprovalLoan = loa and
  // 		loa.ReferedLoanRequest = r and
  // 		result = true`,
  //   level: Level.Hard,
  // }),
];

const service = new Service({
  name: 'LoanProcessingSystemSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'bookNewLoan',
  description:
    'Once a loan aggrement has been sighed by the customer and returned to the bank, the loan clerk has the system create a loan account based on the agreed-on terms and conditions',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
