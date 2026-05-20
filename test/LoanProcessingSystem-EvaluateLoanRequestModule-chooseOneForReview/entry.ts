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

class EvaluateLoanRequestModule {
  /*TempVariable Start*/
  CurrentLoanRequest: LoanRequest;
  CurrentLoanRequests: LoanRequest[];
  /*TempVariable End*/

  /*choose a loan request which id equals the request id from the current loan requests, if exist, then the current loan request should be it.*/
  chooseOneForReview(requestid: number): LoanRequest {
    /*Definition Start*/
    let rs: LoanRequest = l({
      logic: () =>
        this.CurrentLoanRequests.find(
          (r: LoanRequest) =>
            l({
              logic: () => r.RequestID === requestid,
              description: 'r.RequestID=requestid',
            }).build().pass
        ),
      description: 'self.CurrentLoanRequests->any(r:LoanRequest|r.RequestID=requestid)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(rs) === false,
      description: 'rs.oclIsUndefined()=false',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () => (this.CurrentLoanRequest = rs),
      description: 'self.CurrentLoanRequest=rs',
    })
      .and({
        execute: () => rs,
        description: 'result=rs',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {EvaluateLoanRequestModule};
