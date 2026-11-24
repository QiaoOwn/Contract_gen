// Explicitly inspected field mappings. This is an evaluation-only catalog, not CRUD inference from names.
export const crudExtensionCatalog = [
  {project: 'AutomatedTellerMachine', useCase: 'manageBankCard', entity: 'BankCard',
    operations: ['createBankCard', 'queryBankCard', 'modifyBankCard', 'deleteBankCard'],
    fields: ['CardID', 'CardStatus', 'Catalog', 'Password', 'Balance']},
  {project: 'AutomatedTellerMachine', useCase: 'manageUser', entity: 'User',
    operations: ['createUser', 'queryUser', 'modifyUser', 'deleteUser'], fields: ['UserID', 'Name', 'Address']},
  {project: 'CoCoME', useCase: 'manageCashDesk', entity: 'CashDesk', operations: ['createCashDesk'], fields: ['Id', 'Name', 'IsOpened']},
  {project: 'CoCoME', useCase: 'manageCashier', entity: 'Cashier', operations: ['createCashier'], fields: ['Id', 'Name']},
  {project: 'CoCoME', useCase: 'manageProductCatalog', entity: 'ProductCatalog', operations: ['createProductCatalog'], fields: ['Id', 'Name']},
  {project: 'CoCoME', useCase: 'manageStore', entity: 'Store', operations: ['createStore'], fields: ['Id', 'Name', 'Address', 'IsOpened']},
  {project: 'CoCoME', useCase: 'manageSupplier', entity: 'Supplier', operations: ['createSupplier'], fields: ['Id', 'Name']},
  {project: 'CoCoME', useCase: 'manageItem', entity: 'Item', operations: ['createItem', 'modifyItem'], fields: ['Barcode', 'Name', 'Price', 'StockNumber', 'OrderPrice']},
  {project: 'LibraryManagementSystem', useCase: 'manageBook', entity: 'Book', operations: ['createBook'],
    fields: ['CallNo', 'Title', 'Edition', 'Author', 'Publisher', 'Description', 'ISBn', 'CopyNum']},
  {project: 'LibraryManagementSystem', useCase: 'manageLibrarian', entity: 'Librarian', operations: ['createLibrarian'], fields: ['LibrarianID', 'Name', 'Password']},
  {project: 'LibraryManagementSystem', useCase: 'manageSubject', entity: 'Subject', operations: ['createSubject'], fields: ['Name']},
  {project: 'LibraryManagementSystem', useCase: 'manageUser', entity: 'User', operations: ['createUser'],
    fields: ['UserID', 'Name', 'Sex', 'Password', 'Email', 'Faculty', 'LoanedNumber', 'BorrowStatus', 'SuspensionDays', 'OverDueFee']},
  {project: 'LoanProcessingSystem', useCase: 'generateLoanLetterAndAgreement', entity: 'LoanAccount', operations: ['createLoanAccount'], fields: ['LoanAccountID', 'Balance', 'Status']},
  {project: 'LoanProcessingSystem', useCase: 'manageLoanTerm', entity: 'LoanTerm',
    operations: ['createLoanTerm', 'queryLoanTerm', 'modifyLoanTerm', 'deleteLoanTerm'], fields: ['ItemID', 'Content']},
] as const;
export type CrudExtensionKind = 'create' | 'query' | 'modify' | 'delete';
export const crudDeferredOperations = {};
