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

class GenerateLoanLetterAndAgreementModule {
  /*TempVariable Start*/
  CurrentApprovalLetter: ApprovalLetter;
  CurrentLoanAgreement: LoanAgreement;
  CurrentLoanRequest: LoanRequest;
  CurrentLoanRequests: LoanRequest[];
  /*TempVariable End*/

  /*if current loan request exist,
   *then create a new loan agreement and set it's content to "Loan Agreement"
   *and
   *save it
   *and
   *attach it to the current loan request*/
  generateLoanAgreement(): boolean {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(this.CurrentLoanRequest) === false,
      description: 'self.CurrentLoanRequest.oclIsUndefined()=false',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    let la: LoanAgreement;
    return l({
      execute: () => (la = new LoanAgreement()),
      description: 'la.oclIsNew()',
    })
      .and({
        execute: () => (la.Content = 'Loan Agreement'),
        description: 'la.Content="Loan Agreement"',
      })
      .and({
        execute: () => (this.CurrentLoanRequest.AttachedLoanAgreement = la),
        description: 'self.CurrentLoanRequest.AttachedLoanAgreement=la',
      })
      .and({
        execute: () => getRepository(LoanAgreement).push(la),
        description: 'LoanAgreement.allInstance()->includes(la)',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {GenerateLoanLetterAndAgreementModule};
