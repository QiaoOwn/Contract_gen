export const REQUIREMENT_PROVENANCE = 'author-normalized-from-system-model-v2' as const;

export type StructuredRequirement = Readonly<{
  intent: string;
  preconditions: readonly string[];
  postconditions: readonly string[];
  provenance: typeof REQUIREMENT_PROVENANCE;
}>;

const requirements = new Map<string, StructuredRequirement>();

const requirementKey = (project: string, useCase: string, operation: string) =>
  [project, useCase, operation].join('/');

const add = (
  project: string,
  useCase: string,
  operation: string,
  intent: string,
  preconditions: readonly string[],
  postconditions: readonly string[]
) => {
  const key = requirementKey(project, useCase, operation);
  if (requirements.has(key)) {
    throw new Error('Duplicate benchmark requirement: ' + key);
  }
  requirements.set(key, {
    intent,
    preconditions,
    postconditions,
    provenance: REQUIREMENT_PROVENANCE,
  });
};

const addCrud = (
  project: string,
  useCase: string,
  entity: string,
  identifier: string,
  fields: readonly string[]
) => {
  const fieldList = fields.join(', ');
  add(
    project,
    useCase,
    'create' + entity,
    'Create a ' + entity + ' record from the supplied ' + fieldList + '.',
    ['No existing ' + entity + ' has the supplied ' + identifier + '.'],
    [
      'A new ' + entity + ' is stored with the supplied ' + fieldList + '.',
      'The operation returns true.',
    ]
  );
  add(
    project,
    useCase,
    'query' + entity,
    'Retrieve the ' + entity + ' identified by the supplied ' + identifier + '.',
    ['The referenced ' + entity + ' exists.'],
    ['The operation returns the referenced ' + entity + '.']
  );
  add(
    project,
    useCase,
    'modify' + entity,
    'Update the ' +
      entity +
      ' identified by ' +
      identifier +
      ' with the supplied ' +
      fieldList +
      '.',
    ['The referenced ' + entity + ' exists.'],
    [
      'The stored ' + entity + ' contains the supplied ' + fieldList + '.',
      'The operation returns true.',
    ]
  );
  add(
    project,
    useCase,
    'delete' + entity,
    'Delete the ' + entity + ' identified by the supplied ' + identifier + '.',
    ['The referenced ' + entity + ' exists in the repository.'],
    ['The ' + entity + ' is removed from the repository.', 'The operation returns true.']
  );
};

// Airport
add(
  'Airport',
  'manageDevice',
  'createDevice',
  'Register a newly installed airport device and assign its responsible staff contact.',
  ['The device identifier is unused.', 'The selected contact identifies an existing Staff member.'],
  [
    'A Device is created with the supplied identifier, name, and location.',
    'The Device is linked to the selected Staff contact and stored.',
    'The operation returns true.',
  ]
);
add(
  'Airport',
  'manageUser',
  'createStaff',
  'Register a new airport Staff member with contact, role, and optional reporting information.',
  ['The staff identifier is unused.'],
  [
    'A Staff member is created with the supplied identity, password, phone, and role.',
    'If bossid identifies an existing Staff member, the new Staff member is linked to that Boss; otherwise the Boss relationship remains undefined.',
    'The operation returns true.',
  ]
);
add(
  'Airport',
  'raiseRepair',
  'approve',
  'Record a staff approval decision for a repair request.',
  ['The referenced Repair exists.', 'The referenced Staff member exists.'],
  [
    'A new ApprovalHistory records the decision and suggestion and is linked to the Repair.',
    'When reject is true, Process advances from 0 to 1 for a role-1 Staff member, from 1 to 2 for role 2, and from 2 to 3 for role 3.',
    'When reject is false, Repair.Process is set to the rejected stage value 5.',
    'The operation returns the new ApprovalHistory.',
  ]
);
add(
  'Airport',
  'raiseRepair',
  'finishRepair',
  'Mark a repair assigned to a worker as finished and record its result.',
  [
    'The referenced Device is assigned to the supplied Staff member.',
    'The Staff member has the Worker role value 3.',
  ],
  ['The Repair.Process is set to the finished stage value 7.', 'The operation returns true.']
);
add(
  'Airport',
  'raiseRepair',
  'feedback',
  'Record feedback from the staff member who raised a completed repair.',
  [
    'The supplied Staff member raised the Repair.',
    'The Staff member has the GroundStaff role value 0.',
    'The Repair.Process is the finished stage value 7.',
  ],
  [
    'The Repair score is updated.',
    'A score greater than or equal to 3 closes the Repair.',
    'A score below 3 leaves the Repair open, records des as its Description, and sets Process to the initial stage value 0.',
    'The operation returns true.',
  ]
);

// Automated teller machine
const addCardInput = (useCase: string) => {
  add(
    'AutomatedTellerMachine',
    useCase,
    'inputCard',
    'Read a bank-card identifier and start an authenticated ATM session.',
    ['The BankCard exists and has NORMAL status.'],
    [
      'If the card belongs to a user, the ATM stores it as the current card, marks the card identifier as validated, and returns true.',
      'Otherwise, the card identifier remains unvalidated and the operation returns false.',
    ]
  );
  add(
    'AutomatedTellerMachine',
    useCase,
    'inputPassword',
    'Validate the supplied password for the card in the current ATM session.',
    ['The card identifier has been validated.', 'A current BankCard is present.'],
    [
      'A matching password marks the session password as validated and returns true.',
      'A non-matching password marks it as unvalidated and returns false.',
    ]
  );
};
const addEjectCard = (useCase: string) =>
  add(
    'AutomatedTellerMachine',
    useCase,
    'ejectCard',
    'End the authenticated ATM session and eject the current card.',
    ['The card identifier and password are validated.', 'A current BankCard is present.'],
    [
      'The current card is cleared.',
      'Authentication, deposit, and withdrawal state is reset, including transaction amounts.',
      'The operation returns true.',
    ]
  );
const addPrintReceipt = (useCase: string) =>
  add(
    'AutomatedTellerMachine',
    useCase,
    'printReceipt',
    'Return the amount to print on the receipt for the current ATM transaction.',
    ['The card identifier and password are validated.', 'A current BankCard is present.'],
    [
      'The withdrawal amount is returned after a withdrawal, the deposit amount after a deposit, and zero when neither occurred.',
    ]
  );

addCardInput('checkBalance');
add(
  'AutomatedTellerMachine',
  'checkBalance',
  'checkBalance',
  'Read the balance of the card in the authenticated ATM session.',
  ['The card identifier and password are validated.', 'A current BankCard is present.'],
  ['The operation returns the current card balance without changing it.']
);
addEjectCard('checkBalance');

addCardInput('depositFunds');
add(
  'AutomatedTellerMachine',
  'depositFunds',
  'depositFunds',
  'Deposit the supplied amount into the card account in the authenticated ATM session.',
  [
    'The card identifier and password are validated.',
    'A current BankCard is present.',
    'The deposit amount is at least 100.',
  ],
  [
    'The card balance increases by the deposited amount.',
    'The session records the deposit and its amount.',
    'The operation returns true.',
  ]
);
addPrintReceipt('depositFunds');
addEjectCard('depositFunds');

addCardInput('withdrawCash');
add(
  'AutomatedTellerMachine',
  'withdrawCash',
  'withdrawCash',
  'Withdraw the supplied amount from the card account in the authenticated ATM session.',
  [
    'The card identifier and password are validated.',
    'A current BankCard is present.',
    'The card balance covers the requested amount.',
  ],
  [
    'The card balance decreases by the withdrawn amount.',
    'The session records the withdrawal and its amount.',
    'The operation returns true.',
  ]
);
addPrintReceipt('withdrawCash');
addEjectCard('withdrawCash');

addCrud('AutomatedTellerMachine', 'manageBankCard', 'BankCard', 'card identifier', [
  'card identifier',
  'status',
  'catalog',
  'password',
  'balance',
]);
addCrud('AutomatedTellerMachine', 'manageUser', 'User', 'user identifier', [
  'user identifier',
  'name',
  'address',
]);

// CoCoME
addCrud('CoCoME', 'manageCashDesk', 'CashDesk', 'identifier', ['identifier', 'name', 'open state']);
addCrud('CoCoME', 'manageCashier', 'Cashier', 'identifier', ['identifier', 'name']);
addCrud('CoCoME', 'manageProductCatalog', 'ProductCatalog', 'identifier', ['identifier', 'name']);
addCrud('CoCoME', 'manageStore', 'Store', 'identifier', [
  'identifier',
  'name',
  'address',
  'open state',
]);
addCrud('CoCoME', 'manageSupplier', 'Supplier', 'identifier', ['identifier', 'name']);
addCrud('CoCoME', 'manageItem', 'Item', 'barcode', [
  'barcode',
  'name',
  'sale price',
  'stock quantity',
  'order price',
]);
add(
  'CoCoME',
  'changePrice',
  'changePrice',
  'Change the sale price of the item identified by a barcode.',
  ['The referenced Item exists.'],
  ['The Item price is set to the supplied new price.', 'The operation returns true.']
);
add(
  'CoCoME',
  'openStore',
  'openStore',
  'Open an existing store and make it the current store.',
  ['The Store exists and is currently closed.'],
  ['The Store becomes open and is stored as the current store.', 'The operation returns true.']
);
add(
  'CoCoME',
  'closeStore',
  'closeStore',
  'Close an existing open store.',
  ['The Store exists and is currently open.'],
  ['The Store becomes closed.', 'The operation returns true.']
);
add(
  'CoCoME',
  'openCashDesk',
  'openCashDesk',
  'Open a cash desk in the current store and make it the current cash desk.',
  ['The CashDesk exists and is closed.', 'The current Store exists and is open.'],
  [
    'The CashDesk becomes open and is stored as the current cash desk.',
    'The operation returns true.',
  ]
);
add(
  'CoCoME',
  'closeCashDesk',
  'closeCashDesk',
  'Close a cash desk in the current open store.',
  ['The CashDesk exists and is open.', 'The current Store exists and is open.'],
  ['The CashDesk becomes closed and remains the current cash desk.', 'The operation returns true.']
);
add(
  'CoCoME',
  'listSuppliers',
  'listSuppliers',
  'List all registered suppliers.',
  ['No additional business condition is required.'],
  ['The operation returns all Supplier records.']
);
add(
  'CoCoME',
  'showStockReports',
  'showStockReports',
  'Produce a stock report containing all items.',
  ['No additional business condition is required.'],
  ['The operation returns all Item records.']
);
add(
  'CoCoME',
  'orderProducts',
  'makeNewOrder',
  'Start a new product order with the supplied order identifier.',
  ['The order identifier is unused.'],
  [
    'A new OrderProduct is created in NEW status with the current time.',
    'The order is stored as the current product order and added to the repository.',
    'The operation returns true.',
  ]
);
add(
  'CoCoME',
  'orderProducts',
  'listAllOutOfStoreProducts',
  'List products whose stock is exhausted.',
  ['No additional business condition is required.'],
  ['The operation returns every Item with a stock quantity of zero.']
);
add(
  'CoCoME',
  'orderProducts',
  'orderItem',
  'Add a requested item and quantity to the current product order.',
  ['The Item identified by the supplied barcode exists.'],
  [
    'A new OrderEntry records the Item, quantity, and order-price subtotal.',
    'The entry is stored and linked to the current OrderProduct.',
    'The operation returns true.',
  ]
);
add(
  'CoCoME',
  'orderProducts',
  'chooseSupplier',
  'Assign a supplier to the current product order.',
  ['The Supplier exists.', 'A current OrderProduct exists.'],
  ['The current order is linked to the selected Supplier.', 'The operation returns true.']
);
add(
  'CoCoME',
  'orderProducts',
  'placeOrder',
  'Place the current product order after its entries have been assembled.',
  ['A current OrderProduct exists.'],
  [
    'The order status becomes REQUESTED.',
    'The order amount increases by the sum of all entry subtotals.',
    'The operation returns true.',
  ]
);
add(
  'CoCoME',
  'processSale',
  'makeNewSale',
  'Start a new sale at the current cash desk.',
  [
    'The current CashDesk exists and is open.',
    'There is no current Sale, or the previous current Sale is complete.',
  ],
  [
    'A new incomplete and not-yet-payable Sale is created and linked to the current CashDesk.',
    'The Sale is stored as the current sale and added to the repository.',
    'The operation returns true.',
  ]
);
add(
  'CoCoME',
  'processSale',
  'enterItem',
  'Add a scanned item and quantity to the current sale.',
  ['The current Sale exists and is incomplete.', 'The scanned Item exists and has positive stock.'],
  [
    'A SalesLineItem is created, linked to the Sale and Item, and records the quantity and subtotal.',
    'The Item stock decreases by the entered quantity.',
    'The operation returns true.',
  ]
);
add(
  'CoCoME',
  'processSale',
  'endSale',
  'Finish item entry and calculate the amount due for the current sale.',
  ['The current Sale exists, is incomplete, and is not yet ready for payment.'],
  [
    'The Sale amount becomes the sum of its line-item subtotals.',
    'The Sale becomes ready for payment and the operation returns the amount due.',
  ]
);
add(
  'CoCoME',
  'processSale',
  'makeCashPayment',
  'Pay the current sale with the supplied cash amount.',
  [
    'The current Sale exists, is incomplete, and is ready for payment.',
    'The tendered amount covers the Sale amount.',
  ],
  [
    'A CashPayment records the tendered amount and change and is linked to the Sale.',
    'The Sale is linked to the current Store, timestamped, and marked complete.',
    'The payment is stored and the operation returns true.',
  ]
);
add(
  'CoCoME',
  'receiveOrderedProduct',
  'receiveOrderedProduct',
  'Receive an existing product order and replenish stock from its entries.',
  ['The referenced OrderProduct exists.'],
  [
    'The order status becomes RECEIVED.',
    'Each ordered Item stock increases by the quantity in its OrderEntry.',
    'The operation returns true.',
  ]
);

// Library management system
add(
  'LibraryManagementSystem',
  'borrowBook',
  'borrowBook',
  'Process a borrowing request from a user identifier and a book-copy barcode.',
  [
    'The User and BookCopy exist.',
    'The User has NORMAL borrowing status and no suspension days.',
    'A BACHELOR Student has fewer than 20 loans, a MASTER Student fewer than 40, another Student fewer than 60, and a Faculty user fewer than 60.',
    'The copy is AVAILABLE, or it is ONHOLDSHELF, marked reserved, and has a matching open reservation for this user.',
  ],
  [
    'A new unreturned Loan is created and linked to the User and BookCopy with today as the loan date.',
    'The due date is 30 days for a Student and 60 days for a Faculty user.',
    'The user loan count increases by one, the copy becomes LOANED, and the 3-, 10-, 17-, and 31-day overdue flags start as false.',
    'If the copy was ONHOLDSHELF, its reserved flag is cleared and the matching reservation is closed.',
    'The operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'cancelReservation',
  'cancelReservation',
  'Cancel an open reservation for a user and a borrowed book copy.',
  [
    'The User, BookCopy, and matching Reserve record exist.',
    'The copy is LOANED, marked reserved, and the reservation is still open.',
  ],
  [
    'The copy is no longer marked reserved.',
    'The reservation is closed.',
    'The operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'countDownSuspensionDay',
  'countDownSuspensionDay',
  'Advance the daily suspension countdown for every suspended user.',
  ['No additional business condition is required.'],
  [
    'Every User with remaining suspension days has the count reduced by one.',
    'A suspended User with no overdue fee returns to NORMAL status when the countdown reaches zero.',
  ]
);
add(
  'LibraryManagementSystem',
  'listBookHistory',
  'listBorrowHistory',
  'List the complete loan history of a user.',
  ['The referenced User exists.'],
  ['The operation returns all Loan records linked to the User.']
);
add(
  'LibraryManagementSystem',
  'listBookHistory',
  'listHodingBook',
  'List the loans currently held by a user.',
  ['The referenced User exists.'],
  ['The operation returns the User loans that have not been returned.']
);
add(
  'LibraryManagementSystem',
  'listBookHistory',
  'listOverDueBook',
  'List copies associated with a user overdue loans.',
  ['The referenced User exists.', 'The overdue active-loan collection can be resolved.'],
  ['The operation returns the BookCopy of each active Loan with a positive overdue fee.']
);
add(
  'LibraryManagementSystem',
  'listBookHistory',
  'listReservationBook',
  'List book copies reserved by a user.',
  ['The referenced User exists.', 'The reservation collection can be resolved.'],
  ['The operation returns the BookCopy associated with each user reservation.']
);
for (const useCase of ['listBookHistory', 'listRecommendBook']) {
  add(
    'LibraryManagementSystem',
    useCase,
    'listRecommendBook',
    'List the books recommended by a user.',
    ['The referenced User exists.', 'The recommendation collection can be resolved.'],
    ['The operation returns all RecommendBook records linked to the User.']
  );
}
add(
  'LibraryManagementSystem',
  'makeReservation',
  'makeReservation',
  'Create a reservation for a user and a currently loaned copy.',
  ['The User and BookCopy exist.', 'The copy is LOANED and is not already reserved.'],
  [
    'A new open Reserve record is created for today and linked to the User and BookCopy.',
    'The copy is marked reserved and the reservation is stored.',
    'The operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'manageBook',
  'createBook',
  'Create a bibliographic Book record from the supplied catalog information.',
  ['No existing Book uses the supplied call number.'],
  [
    'A new Book stores the call number, title, edition, author, publisher, description, ISBN, and copy count.',
    'The Book is stored and the operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'manageBookCopy',
  'addBookCopy',
  'Add a physical copy to an existing book.',
  [
    'The Book identified by call number exists.',
    'That Book has no copy with the supplied barcode.',
  ],
  [
    'A new AVAILABLE and unreserved BookCopy is created with the supplied barcode and location.',
    'The copy is linked to the Book, the copy count increases, and the copy is stored.',
    'The operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'manageLibrarian',
  'createLibrarian',
  'Register a librarian with an identifier, name, and password.',
  ['The librarian identifier is unused.'],
  ['A new Librarian is stored with the supplied data.', 'The operation returns true.']
);
add(
  'LibraryManagementSystem',
  'manageSubject',
  'createSubject',
  'Create a library subject category.',
  ['No existing Subject has the supplied name.'],
  ['A new Subject with that name is stored.', 'The operation returns true.']
);
add(
  'LibraryManagementSystem',
  'manageUser',
  'createUser',
  'Register a library user with identity, authentication, faculty, and borrowing-state data.',
  ['The user identifier is unused.'],
  [
    'A new User stores all supplied personal, login, loan-count, status, suspension, and fee values.',
    'The User is stored and the operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'payOverDueFee',
  'payOverDueFee',
  'Pay the outstanding overdue fee for a user and the associated returned overdue loans.',
  [
    'The User exists and has returned overdue loans with positive fees.',
    'The supplied payment covers the user total overdue fee.',
  ],
  [
    'The User overdue fee and each applicable Loan overdue fee become zero.',
    'The operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'recommendBook',
  'recommendBook',
  'Record a user recommendation for a book not yet represented by that recommendation call number.',
  ['The User exists.', 'The recommendation call number is unused.'],
  [
    'A RecommendBook is created with the supplied catalog data and today as the recommendation date.',
    'It is linked to the User and stored.',
    'The operation returns true.',
  ]
);
add(
  'LibraryManagementSystem',
  'renewBook',
  'renewBook',
  'Renew an active loan for a user and a loaned book copy.',
  [
    'The User, BookCopy, and matching Loan exist and the User has NORMAL status.',
    'The copy is not reserved, the due date is after today, and the Loan has no overdue fee.',
    'A Student has fewer than 3 renewals and a Faculty user has fewer than 6.',
  ],
  [
    'The renewal count increases and the renewal date becomes today.',
    'From its previous value, the due date is extended by 20 days for a BACHELOR Student, 40 for a MASTER Student, 60 for another Student, and 60 for Faculty.',
    'The operation returns true.',
  ]
);
const addBookSearch = (
  operation: string,
  criterion: string,
  precondition: string,
  result: string
) =>
  add(
    'LibraryManagementSystem',
    'searchBook',
    operation,
    'Search the library catalog by ' + criterion + '.',
    [precondition],
    [result]
  );
addBookSearch(
  'searchBookByBarCode',
  'book-copy barcode',
  'The supplied barcode is a String value.',
  'The operation returns Books having a copy with the supplied barcode.'
);
addBookSearch(
  'searchBookByTitle',
  'title',
  'The supplied title is not empty.',
  'The operation returns Books whose title equals the supplied title.'
);
addBookSearch(
  'searchBookByAuthor',
  'author',
  'The supplied author name is not empty.',
  'The operation returns Books whose author equals the supplied name.'
);
addBookSearch(
  'searchBookByISBN',
  'ISBN',
  'The supplied ISBN is a String value.',
  'The operation returns Books whose ISBN equals the supplied value.'
);
addBookSearch(
  'searchBookBySubject',
  'subject',
  'The supplied subject is a String value.',
  'The operation returns Books linked to a Subject with the supplied name.'
);
add(
  'LibraryManagementSystem',
  'sendNotificationEmail',
  'sendNotificationEmail',
  'Send a notification to a supplied email address.',
  ['The email address is not empty.'],
  ['The notification request succeeds and the operation returns true.']
);

// Loan processing system
add(
  'LoanProcessingSystem',
  'closeOutLoan',
  'closeOutLoan',
  'Close an existing open loan.',
  ['The Loan exists and has LSOPEN status.'],
  ['The Loan status becomes CLOSED.', 'The operation returns true.']
);
add(
  'LoanProcessingSystem',
  'enterValidatedCreditReferences',
  'listSubmitedLoanRequest',
  'Load all submitted loan requests for credit-reference validation.',
  ['At least one submitted LoanRequest exists.'],
  ['The submitted requests become the current request collection and are returned.']
);
add(
  'LoanProcessingSystem',
  'enterValidatedCreditReferences',
  'chooseLoanRequest',
  'Select one loan request from the current request collection.',
  ['The supplied request identifier matches a current LoanRequest.'],
  ['The matching request becomes the current LoanRequest and is returned.']
);
add(
  'LoanProcessingSystem',
  'enterValidatedCreditReferences',
  'markRequestValid',
  'Mark the selected loan request references as validated.',
  ['A current LoanRequest exists.'],
  ['Its status becomes REFERENCESVALIDATED.', 'The operation returns true.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'listTenLoanRequest',
  'Load LoanRequest records whose status is REFERENCESVALIDATED for evaluation.',
  ['The collection of matching LoanRequest records can be resolved.'],
  ['The matching requests become the current request collection and are returned.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'chooseOneForReview',
  'Select a loan request from the current collection for review.',
  ['The supplied identifier matches a current LoanRequest.'],
  ['The matching request becomes the current LoanRequest and is returned.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'checkCreditHistory',
  'Retrieve the credit history attached to the current loan request.',
  ['A current LoanRequest and its requested CreditHistory exist.'],
  ['The operation returns that CreditHistory.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'reviewCheckingAccount',
  'Retrieve the checking-account history attached to the current loan request.',
  ['A current LoanRequest and its requested CheckingAccount exist.'],
  ['The operation returns that CheckingAccount.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'listAvaiableLoanTerm',
  'List all loan terms available for evaluation.',
  ['No additional business condition is required.'],
  ['The operation returns all LoanTerm records.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'addLoanTerm',
  'Attach a selected loan term to the current loan request.',
  ['A current LoanRequest exists.', 'The selected LoanTerm exists.'],
  ['The LoanTerm is linked to the current request.', 'The operation returns true.']
);
add(
  'LoanProcessingSystem',
  'evaluateLoanRequest',
  'approveLoanRequest',
  'Approve the current loan request.',
  ['A current LoanRequest exists.'],
  ['Its status becomes APPROVED.', 'The operation returns true.']
);
add(
  'LoanProcessingSystem',
  'generateLoanLetterAndAgreement',
  'listApprovalRequest',
  'Load all approved loan requests for document generation.',
  ['The collection of approved LoanRequest records can be resolved.'],
  ['The approved requests become the current request collection and are returned.']
);
add(
  'LoanProcessingSystem',
  'generateLoanLetterAndAgreement',
  'genereateApprovalLetter',
  'Generate an approval letter for an existing loan request.',
  ['The LoanRequest identified by the supplied identifier exists.'],
  [
    'A new ApprovalLetter with the standard content is created and attached to the request.',
    'The request becomes current, the letter is stored, and the operation returns true.',
  ]
);
add(
  'LoanProcessingSystem',
  'generateLoanLetterAndAgreement',
  'generateLoanAgreement',
  'Generate a loan agreement for the current approved request.',
  ['A current LoanRequest exists.'],
  [
    'A new LoanAgreement with the standard content is attached to the current request and stored.',
    'The operation returns true.',
  ]
);
add(
  'LoanProcessingSystem',
  'generateLoanLetterAndAgreement',
  'createLoanAccount',
  'Create a loan account with the supplied identifier, balance, and status.',
  ['The loan-account identifier is unused.'],
  [
    'A new LoanAccount stores the supplied values and enters the repository.',
    'The operation returns true.',
  ]
);
add(
  'LoanProcessingSystem',
  'loanPayment',
  'loanPayment',
  'Apply one scheduled repayment to an open loan.',
  ['The Loan exists and has LSOPEN status.'],
  ['The remaining amount decreases by the Loan repayment amount.', 'The operation returns true.']
);
addCrud('LoanProcessingSystem', 'manageLoanTerm', 'LoanTerm', 'item identifier', [
  'item identifier',
  'content',
]);
add(
  'LoanProcessingSystem',
  'submitLoanRequest',
  'enterLoanInformation',
  'Create a loan request from the applicant, requested-loan, contact, reference, and account information.',
  ['The request identifier is unused.'],
  [
    'A new LoanRequest stores all supplied application fields and enters the repository.',
    'The request becomes the current LoanRequest and the operation returns true.',
  ]
);
add(
  'LoanProcessingSystem',
  'submitLoanRequest',
  'calculateScore',
  'Calculate and record the credit score for the current loan request.',
  ['A current LoanRequest, its checking-account history, and its credit history exist.'],
  [
    'The request credit score becomes 100 and its status becomes SUBMITTED.',
    'The operation returns the calculated score.',
  ]
);

// REQUIREMENT CATALOG

export const getBenchmarkRequirement = (
  project: string,
  useCase: string,
  operation: string
): StructuredRequirement => {
  const key = requirementKey(project, useCase, operation);
  const requirement = requirements.get(key);
  if (!requirement) {
    throw new Error('Missing benchmark requirement: ' + key);
  }
  return requirement;
};

export const listBenchmarkRequirementKeys = () => [...requirements.keys()].sort();

export const formatStructuredRequirement = (requirement: StructuredRequirement) =>
  [
    'Operation intent:',
    requirement.intent,
    '',
    'Preconditions:',
    ...requirement.preconditions.map((item) => '- ' + item),
    '',
    'Postconditions:',
    ...requirement.postconditions.map((item) => '- ' + item),
  ].join('\n');
