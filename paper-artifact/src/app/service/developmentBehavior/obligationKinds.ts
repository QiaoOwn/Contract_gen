import type {DevelopmentObligation} from './types';

export const OBLIGATION_KIND_LABELS = {
  admissibility: 'Operation admission condition',
  result: 'Return value',
  'object-identity': 'Referenced object identity',
  attribute: 'Attribute value',
  association: 'Association link',
  collection: 'Collection membership',
  creation: 'Object creation',
  deletion: 'Repository removal',
  'pre-state': 'Relation to operation-entry state',
  conditional: 'Conditional effect',
  temporal: 'Date or duration obligation',
  'service-state': 'Temporary or service state',
  'state-transition': 'Explicit status transition',
  'repository-membership': 'Repository membership',
} as const;
export type ObligationKind = keyof typeof OBLIGATION_KIND_LABELS;
const query: Record<string, readonly ObligationKind[]> = {Q01: ['result', 'object-identity']};
// These shapes label the explicitly registered obligations below; they do not
// infer requirements from operation names or generate contract expressions.
const registeredCreation: Record<string, readonly ObligationKind[]> = {
  Q01: ['creation', 'attribute'],
  Q02: ['repository-membership'],
  Q03: ['result'],
};
const registeredModification: Record<string, readonly ObligationKind[]> = {
  Q01: ['attribute'],
  Q02: ['result'],
};
const registeredDeletion: Record<string, readonly ObligationKind[]> = {
  Q01: ['deletion', 'repository-membership'],
  Q02: ['result'],
};
const modification = (attributes: number): Record<string, readonly ObligationKind[]> =>
  Object.fromEntries([
    ...Array.from(
      {length: attributes},
      (_, i) => [`Q${String(i + 1).padStart(2, '0')}`, ['attribute']] as const
    ),
    [`Q${String(attributes + 1).padStart(2, '0')}`, ['result']],
  ]);
const inputCard: Record<string, readonly ObligationKind[]> = {
  Q01: ['service-state', 'conditional'],
  Q02: ['service-state', 'object-identity', 'conditional'],
  Q03: ['result', 'conditional'],
  Q04: ['service-state', 'conditional'],
  Q05: ['result', 'conditional'],
};

// Explicitly annotated from the registered source obligations. Never infer effects
// from operation names, exception messages or the candidate that failed a test.
export const POSTCONDITION_OBLIGATION_KINDS: Readonly<
  Record<string, Record<string, readonly ObligationKind[]>>
> = {
  LoanProcessingSystem_enterValidatedCreditReferences_chooseLoanRequest:{Q01:['service-state','object-identity'],Q02:['result','object-identity']},
  LoanProcessingSystem_enterValidatedCreditReferences_markRequestValid:{Q01:['state-transition'],Q02:['result']},
  LoanProcessingSystem_evaluateLoanRequest_chooseOneForReview:{Q01:['service-state','object-identity'],Q02:['result','object-identity']},
  LoanProcessingSystem_evaluateLoanRequest_approveLoanRequest:{Q01:['state-transition'],Q02:['result']},
  LoanProcessingSystem_evaluateLoanRequest_listTenLoanRequest:{Q01:['service-state','collection'],Q02:['result','collection','object-identity']},
  LoanProcessingSystem_evaluateLoanRequest_checkCreditHistory:{Q01:['result','association','object-identity']},
  LoanProcessingSystem_evaluateLoanRequest_reviewCheckingAccount:{Q01:['result','association','object-identity']},
  LoanProcessingSystem_evaluateLoanRequest_listAvaiableLoanTerm:{Q01:['result','collection']},
  LoanProcessingSystem_generateLoanLetterAndAgreement_listApprovalRequest:{Q01:['service-state','collection'],Q02:['result','collection','object-identity']},
  LoanProcessingSystem_generateLoanLetterAndAgreement_genereateApprovalLetter:{Q01:['creation','repository-membership'],Q02:['attribute'],Q03:['association','object-identity'],Q04:['service-state','object-identity'],Q05:['result']},
  LoanProcessingSystem_generateLoanLetterAndAgreement_generateLoanAgreement:{Q01:['creation','repository-membership'],Q02:['attribute'],Q03:['association','object-identity'],Q04:['result']},
  LoanProcessingSystem_submitLoanRequest_enterLoanInformation:{
    Q01:['attribute'],Q02:['attribute'],Q03:['attribute'],Q04:['attribute'],Q05:['attribute'],Q06:['attribute'],
    Q07:['attribute'],Q08:['attribute'],Q09:['attribute'],Q10:['attribute'],Q11:['attribute'],Q12:['attribute'],Q13:['attribute'],
    Q14:['creation','repository-membership'],Q15:['service-state','object-identity'],Q16:['result'],
  },
  LoanProcessingSystem_submitLoanRequest_calculateScore:{Q01:['attribute'],Q02:['state-transition'],Q03:['result','attribute']},
  CoCoME_orderProducts_orderItem:{Q01:['creation','repository-membership'],Q02:['attribute'],Q03:['attribute'],Q04:['association','object-identity'],Q05:['collection','association'],Q06:['result']},
  CoCoME_processSale_enterItem: {
    Q01:['creation','repository-membership'],Q02:['service-state','object-identity'],
    Q03:['association','object-identity'],Q04:['association','collection'],Q05:['attribute'],
    Q06:['association','object-identity'],Q07:['attribute','pre-state'],Q08:['attribute'],Q09:['result'],
  },
  CoCoME_processSale_makeCashPayment: {
    Q01:['creation','repository-membership'],Q02:['attribute'],Q03:['association','object-identity'],
    Q04:['association','object-identity'],Q05:['association','object-identity'],Q06:['association','collection'],
    Q07:['state-transition'],Q08:['temporal'],Q09:['attribute'],Q10:['result'],
  },
  CoCoME_orderProducts_makeNewOrder: {Q01: ['creation', 'object-identity'], Q02: ['attribute', 'state-transition'], Q03: ['attribute'], Q04: ['temporal'], Q05: ['repository-membership'], Q06: ['service-state', 'object-identity'], Q07: ['result']},
  CoCoME_processSale_makeNewSale: {Q01: ['creation', 'object-identity'], Q02: ['association', 'object-identity'], Q03: ['association', 'collection'], Q04: ['attribute'], Q05: ['attribute'], Q06: ['repository-membership'], Q07: ['service-state', 'object-identity'], Q08: ['result']},
  CoCoME_changePrice_changePrice: {Q01: ['attribute'], Q02: ['result']},
  CoCoME_listSuppliers_listSuppliers: {Q01: ['result', 'collection', 'object-identity']},
  CoCoME_showStockReports_showStockReports: {Q01: ['result', 'collection', 'object-identity']},
  CoCoME_orderProducts_listAllOutOfStoreProducts: {Q01: ['result', 'collection', 'object-identity']},
  CoCoME_orderProducts_chooseSupplier: {Q01: ['association', 'object-identity', 'service-state'], Q02: ['result']},
  AutomatedTellerMachine_depositFunds_printReceipt: {Q01: ['result', 'service-state', 'conditional'], Q02: ['result', 'service-state', 'conditional'], Q03: ['result', 'conditional']},
  AutomatedTellerMachine_withdrawCash_printReceipt: {Q01: ['result', 'service-state', 'conditional'], Q02: ['result', 'service-state', 'conditional'], Q03: ['result', 'conditional']},
  AutomatedTellerMachine_depositFunds_ejectCard: {Q01: ['service-state', 'object-identity'], Q02: ['service-state'], Q03: ['service-state'], Q04: ['service-state'], Q05: ['service-state'], Q06: ['service-state'], Q07: ['service-state'], Q08: ['result']},
  AutomatedTellerMachine_withdrawCash_ejectCard: {Q01: ['service-state', 'object-identity'], Q02: ['service-state'], Q03: ['service-state'], Q04: ['service-state'], Q05: ['service-state'], Q06: ['service-state'], Q07: ['service-state'], Q08: ['result']},
  AutomatedTellerMachine_withdrawCash_withdrawCash: {Q01: ['attribute', 'pre-state'], Q02: ['service-state'], Q03: ['service-state'], Q04: ['result']},
  AutomatedTellerMachine_checkBalance_inputPassword: {Q01: ['service-state', 'conditional'], Q02: ['result', 'conditional'], Q03: ['service-state', 'conditional'], Q04: ['result', 'conditional']},
  AutomatedTellerMachine_depositFunds_inputPassword: {Q01: ['service-state', 'conditional'], Q02: ['result', 'conditional'], Q03: ['service-state', 'conditional'], Q04: ['result', 'conditional']},
  AutomatedTellerMachine_withdrawCash_inputPassword: {Q01: ['service-state', 'conditional'], Q02: ['result', 'conditional'], Q03: ['service-state', 'conditional'], Q04: ['result', 'conditional']},
  AutomatedTellerMachine_checkBalance_checkBalance: {Q01: ['result', 'attribute']},
  AutomatedTellerMachine_depositFunds_depositFunds: {Q01: ['attribute', 'pre-state'], Q02: ['service-state'], Q03: ['service-state'], Q04: ['result']},
  LibraryManagementSystem_countDownSuspensionDay_countDownSuspensionDay: {
    Q01: ['attribute', 'pre-state'], Q02: ['attribute', 'pre-state', 'conditional', 'state-transition'],
    Q03: ['attribute', 'conditional', 'state-transition'], Q04: ['attribute', 'pre-state'],
  },
  LibraryManagementSystem_listBookHistory_listOverDueBook: {
    Q01: ['result', 'association', 'collection', 'object-identity'],
    Q02: ['result', 'collection', 'object-identity'], Q03: ['result', 'object-identity'],
  },
  LibraryManagementSystem_listBookHistory_listBorrowHistory: {
    Q01: ['result', 'association', 'collection', 'object-identity'],
  },
  LibraryManagementSystem_sendNotificationEmail_sendNotificationEmail: {Q01: ['result']},
  LibraryManagementSystem_renewBook_renewBook: {Q01:['attribute','pre-state'],Q02:['temporal'],Q03:['temporal','pre-state','conditional'],Q04:['result']},
  LibraryManagementSystem_recommendBook_recommendBook: {Q01:['creation'],Q02:['attribute'],Q03:['attribute'],Q04:['attribute'],
    Q05:['attribute'],Q06:['attribute'],Q07:['attribute'],Q08:['attribute'],Q09:['temporal'],Q10:['association','object-identity'],
    Q11:['association','collection'],Q12:['repository-membership'],Q13:['result']},
  LibraryManagementSystem_payOverDueFee_payOverDueFee: {Q01:['attribute'],Q02:['attribute','collection'],Q03:['result']},
  LibraryManagementSystem_manageBookCopy_addBookCopy: {Q01: ['creation'], Q02: ['attribute'], Q03: ['attribute'], Q04: ['attribute'],
    Q05: ['attribute'], Q06: ['association','collection'], Q07: ['association','object-identity'], Q08: ['attribute','pre-state'],
    Q09: ['repository-membership'], Q10: ['result']},
  LibraryManagementSystem_makeReservation_makeReservation: {Q01: ['creation'], Q02: ['attribute'], Q03: ['attribute'],
    Q04: ['temporal'], Q05: ['association', 'object-identity'], Q06: ['association', 'object-identity'],
    Q07: ['collection', 'association'], Q08: ['collection', 'association'], Q09: ['repository-membership'], Q10: ['result']},
  LibraryManagementSystem_cancelReservation_cancelReservation: {Q01: ['attribute'], Q02: ['state-transition'], Q03: ['result']},
  LibraryManagementSystem_listBookHistory_listHodingBook: {
    Q01: ['result', 'association', 'collection', 'object-identity'],
  },
  LibraryManagementSystem_listBookHistory_listReservationBook: {
    Q01: ['result', 'association', 'collection', 'object-identity'],
    Q02: ['result', 'collection', 'object-identity'], Q03: ['result', 'object-identity'],
    Q04: ['result', 'association', 'collection'],
  },
  AutomatedTellerMachine_manageBankCard_createBankCard: registeredCreation,
  AutomatedTellerMachine_manageBankCard_queryBankCard: query,
  AutomatedTellerMachine_manageBankCard_modifyBankCard: registeredModification,
  AutomatedTellerMachine_manageBankCard_deleteBankCard: registeredDeletion,
  AutomatedTellerMachine_manageUser_createUser: registeredCreation,
  AutomatedTellerMachine_manageUser_queryUser: query,
  AutomatedTellerMachine_manageUser_modifyUser: registeredModification,
  AutomatedTellerMachine_manageUser_deleteUser: registeredDeletion,
  CoCoME_manageCashDesk_createCashDesk: registeredCreation,
  CoCoME_manageCashier_createCashier: registeredCreation,
  CoCoME_manageProductCatalog_createProductCatalog: registeredCreation,
  CoCoME_manageStore_createStore: registeredCreation,
  CoCoME_manageSupplier_createSupplier: registeredCreation,
  CoCoME_manageItem_createItem: registeredCreation,
  CoCoME_manageItem_modifyItem: registeredModification,
  LibraryManagementSystem_manageBook_createBook: registeredCreation,
  LibraryManagementSystem_manageLibrarian_createLibrarian: registeredCreation,
  LibraryManagementSystem_manageSubject_createSubject: registeredCreation,
  LibraryManagementSystem_manageUser_createUser: registeredCreation,
  LoanProcessingSystem_manageLoanTerm_createLoanTerm: registeredCreation,
  LoanProcessingSystem_manageLoanTerm_queryLoanTerm: query,
  LoanProcessingSystem_manageLoanTerm_modifyLoanTerm: registeredModification,
  LoanProcessingSystem_manageLoanTerm_deleteLoanTerm: registeredDeletion,
  Airport_raiseRepair_approve: {
    Q01: ['creation', 'repository-membership', 'attribute', 'association'],
    Q02: ['attribute', 'conditional', 'state-transition'],
    Q03: ['attribute', 'conditional', 'state-transition'],
    Q04: ['result', 'object-identity'],
  },
  Airport_raiseRepair_finishRepair: {Q01: ['attribute', 'state-transition'], Q02: ['result']},
  Airport_raiseRepair_feedback: {
    Q01: ['attribute'],
    Q02: ['attribute', 'conditional'],
    Q03: ['attribute', 'conditional', 'state-transition'],
    Q04: ['result'],
  },
  CoCoME_orderProducts_placeOrder: {
    Q01: ['state-transition'],
    Q02: ['attribute', 'collection', 'pre-state'],
    Q03: ['result'],
  },
  CoCoME_processSale_endSale: {
    Q01: ['state-transition'],
    Q02: ['attribute', 'collection'],
    Q03: ['result'],
  },
  CoCoME_receiveOrderedProduct_receiveOrderedProduct: {
    Q01: ['state-transition'],
    Q02: ['attribute', 'collection', 'pre-state'],
    Q03: ['result'],
  },
  Airport_manageDevice_createDevice: {
    Q01: ['creation', 'attribute'],
    Q02: ['association', 'repository-membership'],
    Q03: ['result'],
  },
  LoanProcessingSystem_generateLoanLetterAndAgreement_createLoanAccount: {
    Q01: ['creation', 'attribute'],
    Q02: ['repository-membership'],
    Q03: ['result'],
  },
  LibraryManagementSystem_listBookHistory_listRecommendBook: {
    Q01: ['result', 'collection', 'object-identity'],
  },
  LibraryManagementSystem_listRecommendBook_listRecommendBook: {
    Q01: ['result', 'collection', 'object-identity'],
  },
  AutomatedTellerMachine_checkBalance_inputCard: inputCard,
  AutomatedTellerMachine_depositFunds_inputCard: inputCard,
  AutomatedTellerMachine_withdrawCash_inputCard: inputCard,
  CoCoME_openStore_openStore: {
    Q01: ['attribute', 'state-transition'],
    Q02: ['service-state', 'object-identity'],
    Q03: ['result'],
  },
  CoCoME_closeStore_closeStore: {Q01: ['attribute', 'state-transition'], Q03: ['result']},
  CoCoME_openCashDesk_openCashDesk: {
    Q01: ['attribute', 'state-transition'],
    Q02: ['service-state', 'object-identity'],
    Q03: ['result'],
  },
  CoCoME_closeCashDesk_closeCashDesk: {
    Q01: ['attribute', 'state-transition'],
    Q02: ['service-state', 'object-identity'],
    Q03: ['result'],
  },
  LoanProcessingSystem_closeOutLoan_closeOutLoan: {
    Q01: ['attribute', 'state-transition'],
    Q03: ['result'],
  },
  LoanProcessingSystem_evaluateLoanRequest_addLoanTerm: {
    Q01: ['association', 'collection'],
    Q02: ['result'],
  },
  CoCoME_manageStore_deleteStore: {Q01: ['deletion', 'repository-membership'], Q02: ['result']},
  CoCoME_manageProductCatalog_deleteProductCatalog: {
    Q01: ['deletion', 'repository-membership'],
    Q02: ['result'],
  },
  CoCoME_manageCashDesk_deleteCashDesk: {
    Q01: ['deletion', 'repository-membership'],
    Q02: ['result'],
  },
  CoCoME_manageCashier_deleteCashier: {Q01: ['deletion', 'repository-membership'], Q02: ['result']},
  CoCoME_manageSupplier_deleteSupplier: {
    Q01: ['deletion', 'repository-membership'],
    Q02: ['result'],
  },
  CoCoME_manageStore_queryStore: query,
  CoCoME_manageProductCatalog_queryProductCatalog: query,
  CoCoME_manageCashDesk_queryCashDesk: query,
  CoCoME_manageCashier_queryCashier: query,
  CoCoME_manageSupplier_querySupplier: query,
  CoCoME_manageItem_queryItem: query,
  CoCoME_manageItem_deleteItem: {Q01: ['deletion', 'repository-membership'], Q02: ['result']},
  CoCoME_manageStore_modifyStore: modification(4),
  CoCoME_manageProductCatalog_modifyProductCatalog: modification(2),
  CoCoME_manageCashDesk_modifyCashDesk: modification(3),
  CoCoME_manageCashier_modifyCashier: modification(2),
  CoCoME_manageSupplier_modifySupplier: modification(2),
  Airport_manageUser_createStaff: {
    Q01: ['creation'],
    Q02: ['attribute'],
    Q03: ['attribute'],
    Q04: ['attribute'],
    Q05: ['attribute'],
    Q06: ['attribute'],
    Q07: ['association', 'conditional'],
    Q09: ['repository-membership'],
    Q10: ['result'],
  },
  AutomatedTellerMachine_checkBalance_ejectCard: {
    Q01: ['service-state'],
    Q02: ['service-state'],
    Q03: ['service-state'],
    Q04: ['service-state'],
    Q05: ['service-state'],
    Q06: ['service-state'],
    Q07: ['service-state'],
    Q08: ['result'],
  },
  LibraryManagementSystem_borrowBook_borrowBook: {
    Q01: ['creation', 'repository-membership'],
    Q02: ['association'],
    Q03: ['association'],
    Q04: ['attribute'],
    Q05: ['attribute', 'temporal'],
    Q06: ['attribute', 'pre-state'],
    Q07: ['association', 'collection'],
    Q08: ['association', 'collection'],
    Q09: ['attribute', 'conditional', 'temporal'],
    Q10: ['attribute', 'conditional'],
    Q11: ['attribute', 'conditional'],
    Q12: ['attribute', 'state-transition'],
    Q13: ['attribute'],
    Q14: ['attribute'],
    Q15: ['attribute'],
    Q16: ['attribute'],
    Q17: ['result'],
  },
  LibraryManagementSystem_searchBook_searchBookByBarCode: {Q01: ['result', 'collection', 'object-identity', 'association']},
  LibraryManagementSystem_searchBook_searchBookByTitle: {Q01: ['result', 'collection', 'object-identity']},
  LibraryManagementSystem_searchBook_searchBookByAuthor: {Q01: ['result', 'collection', 'object-identity']},
  LibraryManagementSystem_searchBook_searchBookByISBN: {Q01: ['result', 'collection', 'object-identity']},
  LibraryManagementSystem_searchBook_searchBookBySubject: {Q01: ['result', 'collection', 'object-identity', 'association']},
  LoanProcessingSystem_loanPayment_loanPayment: {
    Q01: ['attribute', 'pre-state'],
    Q02: ['result'],
  },
  LoanProcessingSystem_enterValidatedCreditReferences_listSubmitedLoanRequest: {
    Q01: ['service-state', 'collection', 'pre-state'],
    Q02: ['result', 'collection', 'pre-state'],
  },
};

export function obligationKinds(
  operationId: string,
  obligation: Pick<DevelopmentObligation, 'id' | 'clause'>
): readonly ObligationKind[] {
  return obligation.clause === 'precondition'
    ? ['admissibility']
    : (POSTCONDITION_OBLIGATION_KINDS[operationId]?.[obligation.id] ?? []);
}
