import {Attribute} from '../../model/Attribute';
import {Entity} from '../../model/Entity';
import {Relationship} from '../../model/Relationship';
const entities = {
  LoanRequest: new Entity({
    name: 'LoanRequest',
    description: '',
    attributes: [
      new Attribute({
        name: 'Status',
        type: 'LoanRequestStatus[SUBMITTED|REFERENCESVALIDATED|APPROVED|READYFORREVIEW|INCOMPLETEINFORMATION]',
        description: 'The Status of LoanRequest',
      }),
      new Attribute({
        name: 'RequestID',
        type: 'Integer',
        description: 'The RequestID of LoanRequest',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'The Name of LoanRequest',
      }),
      new Attribute({
        name: 'LoanAmount',
        type: 'Real',
        description: 'The LoanAmount of LoanRequest',
      }),
      new Attribute({
        name: 'LoanPurpose',
        type: 'String',
        description: 'The LoanPurpose of LoanRequest',
      }),
      new Attribute({
        name: 'Income',
        type: 'Real',
        description: 'The Income of LoanRequest',
      }),
      new Attribute({
        name: 'PhoneNumber',
        type: 'Integer',
        description: 'The PhoneNumber of LoanRequest',
      }),
      new Attribute({
        name: 'PostalAddress',
        type: 'String',
        description: 'The PostalAddress of LoanRequest',
      }),
      new Attribute({
        name: 'ZipCode',
        type: 'Integer',
        description: 'The ZipCode of LoanRequest',
      }),
      new Attribute({
        name: 'Email',
        type: 'String',
        description: 'The Email of LoanRequest',
      }),
      new Attribute({
        name: 'WorkReferences',
        type: 'String',
        description: 'The WorkReferences of LoanRequest',
      }),
      new Attribute({
        name: 'CreditReferences',
        type: 'String',
        description: 'The CreditReferences of LoanRequest',
      }),
      new Attribute({
        name: 'CheckingAccountNumber',
        type: 'Integer',
        description: 'The CheckingAccountNumber of LoanRequest',
      }),
      new Attribute({
        name: 'SecurityNumber',
        type: 'Integer',
        description: 'The SecurityNumber of LoanRequest',
      }),
      new Attribute({
        name: 'CreditScore',
        type: 'Integer',
        description: 'The CreditScore of LoanRequest',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'ApprovalLoan',
        relatedEntity: 'Loan',
        associationType: 'Association',
        description: 'One LoanRequest is linked with one Loan',
      }),
      new Relationship({
        name: 'RequestedCAHistory',
        relatedEntity: 'CheckingAccount',
        associationType: 'Association',
        description: 'One LoanRequest is linked to one CheckingAccount',
      }),
      new Relationship({
        name: 'RequestedCreditHistory',
        relatedEntity: 'CreditHistory',
        associationType: 'Association',
        description: 'One LoanRequest is linked to one CreditHistory',
      }),
      new Relationship({
        name: 'AttachedApprovalLetter',
        relatedEntity: 'ApprovalLetter',
        associationType: 'Association',
        description: 'One LoanRequest is linked to one ApprovalLetter',
      }),
      new Relationship({
        name: 'AttachedLoanAgreement',
        relatedEntity: 'LoanAgreement',
        associationType: 'Association',
        description: 'One LoanRequest is linked to one LoanAgreement',
      }),
      new Relationship({
        name: 'AttachedLoanTerms',
        relatedEntity: 'Set(LoanTerm)',
        associationType: 'Association',
        description: 'One LoanRequest is linked to many LoanTerm',
      }),
    ],
  }),
  Loan: new Entity({
    name: 'Loan',
    description: '',
    attributes: [
      new Attribute({
        name: 'LoanID',
        type: 'Integer',
        description: 'The LoanID of Loan',
      }),
      new Attribute({
        name: 'RemainAmountToPay',
        type: 'Real',
        description: 'The RemainAmountToPay of Loan',
      }),
      new Attribute({
        name: 'Status',
        type: 'LoanStatus[LSOPEN|CLOSED]',
        description: 'The Status of Loan',
      }),
      new Attribute({
        name: 'IsPaidinFull',
        type: 'Boolean',
        description: 'The IsPaidinFull of Loan',
      }),
      new Attribute({
        name: 'StartDate',
        type: 'LocalDate',
        description: 'The StartDate of Loan',
      }),
      new Attribute({
        name: 'EndDate',
        type: 'LocalDate',
        description: 'The EndDate of Loan',
      }),
      new Attribute({
        name: 'CurrentOverDueDate',
        type: 'LocalDate',
        description: 'The CurrentOverDueDate of Loan',
      }),
      new Attribute({
        name: 'RePaymentDays',
        type: 'Integer',
        description: 'The RePaymentDays of Loan',
      }),
      new Attribute({
        name: 'RepaymentAmount',
        type: 'Real',
        description: 'The RepaymentAmount of Loan',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'ReferedLoanRequest',
        relatedEntity: 'LoanRequest',
        associationType: 'Association',
        description: 'One Loan is linked with one LoanRequest',
      }),
      new Relationship({
        name: 'BelongedLoanAccount',
        relatedEntity: 'LoanAccount',
        associationType: 'Association',
        description: 'One Loan is linked to one LoanAccount',
      }),
    ],
  }),
  LoanTerm: new Entity({
    name: 'LoanTerm',
    description: '',
    attributes: [
      new Attribute({
        name: 'ItemID',
        type: 'Integer',
        description: 'The ItemID of LoanTerm',
      }),
      new Attribute({
        name: 'Content',
        type: 'String',
        description: 'The Content of LoanTerm',
      }),
    ],
  }),
  CheckingAccount: new Entity({
    name: 'CheckingAccount',
    description: '',
    attributes: [
      new Attribute({
        name: 'Balance',
        type: 'Real',
        description: 'The Balance of CheckingAccount',
      }),
      new Attribute({
        name: 'Status',
        type: 'Status[GOODSTANDING|SUSPENDED]',
        description: 'The Status of CheckingAccount',
      }),
    ],
  }),
  CreditHistory: new Entity({
    name: 'CreditHistory',
    description: '',
    attributes: [
      new Attribute({
        name: 'OutstandingDebt',
        type: 'Real',
        description: 'The OutstandingDebt of CreditHistory',
      }),
      new Attribute({
        name: 'BadDebits',
        type: 'Integer',
        description: 'The BadDebits of CreditHistory',
      }),
    ],
  }),
  LoanAccount: new Entity({
    name: 'LoanAccount',
    description: '',
    attributes: [
      new Attribute({
        name: 'LoanAccountID',
        type: 'Integer',
        description: 'The LoanAccountID of LoanAccount',
      }),
      new Attribute({
        name: 'Balance',
        type: 'Real',
        description: 'The Balance of LoanAccount',
      }),
      new Attribute({
        name: 'Status',
        type: 'LoanAccountStatus[NORMAL|HASPAIDINFULL]',
        description: 'The Status of LoanAccount',
      }),
    ],
  }),
  ApprovalLetter: new Entity({
    name: 'ApprovalLetter',
    description: '',
    attributes: [
      new Attribute({
        name: 'Content',
        type: 'String',
        description: 'The Content of ApprovalLetter',
      }),
    ],
  }),
  LoanAgreement: new Entity({
    name: 'LoanAgreement',
    description: 'The loan agreement',
    attributes: [
      new Attribute({
        name: 'Content',
        type: 'String',
        description: 'The Content of LoanAgreement',
      }),
    ],
  }),
};

export default entities;
