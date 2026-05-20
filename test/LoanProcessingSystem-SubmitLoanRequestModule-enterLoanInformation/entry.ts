import dayjs from 'dayjs';
import {l, PreconditionError, StandardOPs} from '../globalEntry';
class LoanRequest {
  /*The Status of LoanRequest*/
  Status: LoanRequestStatus;
  /*The RequestID of LoanRequest*/
  RequestID: number;
  /*The Name of LoanRequest*/
  Name: string;
  /*The LoanAmount of LoanRequest*/
  LoanAmount: number;
  /*The LoanPurpose of LoanRequest*/
  LoanPurpose: string;
  /*The Income of LoanRequest*/
  Income: number;
  /*The PhoneNumber of LoanRequest*/
  PhoneNumber: number;
  /*The PostalAddress of LoanRequest*/
  PostalAddress: string;
  /*The ZipCode of LoanRequest*/
  ZipCode: number;
  /*The Email of LoanRequest*/
  Email: string;
  /*The WorkReferences of LoanRequest*/
  WorkReferences: string;
  /*The CreditReferences of LoanRequest*/
  CreditReferences: string;
  /*The CheckingAccountNumber of LoanRequest*/
  CheckingAccountNumber: number;
  /*The SecurityNumber of LoanRequest*/
  SecurityNumber: number;
  /*The CreditScore of LoanRequest*/
  CreditScore: number;
  /*One LoanRequest is linked with one Loan*/
  ApprovalLoan: Loan;
  /*One LoanRequest is linked to one CheckingAccount*/
  RequestedCAHistory: CheckingAccount;
  /*One LoanRequest is linked to one CreditHistory*/
  RequestedCreditHistory: CreditHistory;
  /*One LoanRequest is linked to one ApprovalLetter*/
  AttachedApprovalLetter: ApprovalLetter;
  /*One LoanRequest is linked to one LoanAgreement*/
  AttachedLoanAgreement: LoanAgreement;
  /*One LoanRequest is linked to many LoanTerm*/
  AttachedLoanTerms: LoanTerm[];
}
class Loan {
  /*The LoanID of Loan*/
  LoanID: number;
  /*The RemainAmountToPay of Loan*/
  RemainAmountToPay: number;
  /*The Status of Loan*/
  Status: LoanStatus;
  /*The IsPaidinFull of Loan*/
  IsPaidinFull: boolean;
  /*The StartDate of Loan*/
  StartDate: dayjs.Dayjs;
  /*The EndDate of Loan*/
  EndDate: dayjs.Dayjs;
  /*The CurrentOverDueDate of Loan*/
  CurrentOverDueDate: dayjs.Dayjs;
  /*The RePaymentDays of Loan*/
  RePaymentDays: number;
  /*The RepaymentAmount of Loan*/
  RepaymentAmount: number;
  /*One Loan is linked with one LoanRequest*/
  ReferedLoanRequest: LoanRequest;
  /*One Loan is linked to one LoanAccount*/
  BelongedLoanAccount: LoanAccount;
}
class LoanTerm {
  /*The ItemID of LoanTerm*/
  ItemID: number;
  /*The Content of LoanTerm*/
  Content: string;
}
class CheckingAccount {
  /*The Balance of CheckingAccount*/
  Balance: number;
  /*The Status of CheckingAccount*/
  Status: Status;
}
class CreditHistory {
  /*The OutstandingDebt of CreditHistory*/
  OutstandingDebt: number;
  /*The BadDebits of CreditHistory*/
  BadDebits: number;
}
class LoanAccount {
  /*The LoanAccountID of LoanAccount*/
  LoanAccountID: number;
  /*The Balance of LoanAccount*/
  Balance: number;
  /*The Status of LoanAccount*/
  Status: LoanAccountStatus;
}
class ApprovalLetter {
  /*The Content of ApprovalLetter*/
  Content: string;
}
/*The loan agreement*/
class LoanAgreement {
  /*The Content of LoanAgreement*/
  Content: string;
}
enum LoanRequestStatus {
  SUBMITTED = 'SUBMITTED',
  REFERENCESVALIDATED = 'REFERENCESVALIDATED',
  APPROVED = 'APPROVED',
  READYFORREVIEW = 'READYFORREVIEW',
  INCOMPLETEINFORMATION = 'INCOMPLETEINFORMATION',
}
enum LoanStatus {
  LSOPEN = 'LSOPEN',
  CLOSED = 'CLOSED',
}
enum Status {
  GOODSTANDING = 'GOODSTANDING',
  SUSPENDED = 'SUSPENDED',
}
enum LoanAccountStatus {
  NORMAL = 'NORMAL',
  HASPAIDINFULL = 'HASPAIDINFULL',
}
const map = new Map();
map.set(LoanRequest, []);
map.set(Loan, []);
map.set(LoanTerm, []);
map.set(CheckingAccount, []);
map.set(CreditHistory, []);
map.set(LoanAccount, []);
map.set(ApprovalLetter, []);
map.set(LoanAgreement, []);
const getRepository = <T>(clazz: new (...args: any[]) => T) => {
  return map.get(clazz) as T[];
};
export {
  LoanRequestStatus,
  LoanStatus,
  Status,
  LoanAccountStatus,
  LoanRequest,
  Loan,
  LoanTerm,
  CheckingAccount,
  CreditHistory,
  LoanAccount,
  ApprovalLetter,
  LoanAgreement,
  getRepository,
};

class SubmitLoanRequestModule {
  /*TempVariable Start*/
  CurrentLoanRequest: LoanRequest;
  /*TempVariable End*/

  /*find a loan request with provided request id, if the loan request is not exist, create a new loan request with provided info and save it, then the current loan request is it*/
  enterLoanInformation(
    requestid: number,
    name: string,
    loanamount: number,
    loanpurpose: string,
    income: number,
    phonenumber: number,
    postaladdress: string,
    zipcode: number,
    email: string,
    workreferences: string,
    creditreferences: string,
    checkingaccountnumber: number,
    securitynumber: number
  ): boolean {
    /*Definition Start*/
    let loanrequest: LoanRequest = l({
      logic: () =>
        getRepository(LoanRequest).find(
          (loa: LoanRequest) =>
            l({
              logic: () => loa.RequestID === requestid,
              description: 'loa.RequestID=requestid',
            }).build().pass
        ),
      description: 'LoanRequest.allInstance()->any(loa:LoanRequest|loa.RequestID=requestid)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(loanrequest) === true,
      description: 'loanrequest.oclIsUndefined()=true',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    let loa: LoanRequest;
    return l({
      execute: () => (loa = new LoanRequest()),
      description: 'loa.oclIsNew()',
    })
      .and({
        execute: () => (loa.RequestID = requestid),
        description: 'loa.RequestID=requestid',
      })
      .and({
        execute: () => (loa.Name = name),
        description: 'loa.Name=name',
      })
      .and({
        execute: () => (loa.LoanAmount = loanamount),
        description: 'loa.LoanAmount=loanamount',
      })
      .and({
        execute: () => (loa.LoanPurpose = loanpurpose),
        description: 'loa.LoanPurpose=loanpurpose',
      })
      .and({
        execute: () => (loa.Income = income),
        description: 'loa.Income=income',
      })
      .and({
        execute: () => (loa.PhoneNumber = phonenumber),
        description: 'loa.PhoneNumber=phonenumber',
      })
      .and({
        execute: () => (loa.PostalAddress = postaladdress),
        description: 'loa.PostalAddress=postaladdress',
      })
      .and({
        execute: () => (loa.ZipCode = zipcode),
        description: 'loa.ZipCode=zipcode',
      })
      .and({
        execute: () => (loa.Email = email),
        description: 'loa.Email=email',
      })
      .and({
        execute: () => (loa.WorkReferences = workreferences),
        description: 'loa.WorkReferences=workreferences',
      })
      .and({
        execute: () => (loa.CreditReferences = creditreferences),
        description: 'loa.CreditReferences=creditreferences',
      })
      .and({
        execute: () => (loa.CheckingAccountNumber = checkingaccountnumber),
        description: 'loa.CheckingAccountNumber=checkingaccountnumber',
      })
      .and({
        execute: () => (loa.SecurityNumber = securitynumber),
        description: 'loa.SecurityNumber=securitynumber',
      })
      .and({
        execute: () => getRepository(LoanRequest).push(loa),
        description: 'LoanRequest.allInstance()->includes(loa)',
      })
      .and({
        execute: () => (this.CurrentLoanRequest = loa),
        description: 'self.CurrentLoanRequest=loa',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {SubmitLoanRequestModule};
