import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import manifest from '../../../../config/development-behavior-registry.json';
import {
  STATE_TRANSITION_CLOCK,
  stateTransitionSpecifications,
  transitionScenarios,
  type StateTransitionOperation,
} from './stateTransitionSpecification';
import {
  ADD_LOAN_TERM_ID,
  ADD_LOAN_TERM_VERSION,
  addLoanTermSources,
  addLoanTermObligations,
  addLoanTermScenarios,
} from './addLoanTermSpecification';
import {
  BORROW_BOOK_ID,
  BORROW_BOOK_CLOCK,
  DEVELOPMENT_BEHAVIOR_VERSION,
  borrowBookSources,
  borrowBookObligations,
  borrowBookScenarios,
} from './borrowBookSpecification';
import {
  ATM_EJECT_CARD_ID,
  ATM_EJECT_CARD_VERSION,
  ATM_EJECT_CARD_CLOCK,
  atmEjectCardSources,
  atmEjectCardObligations,
  atmEjectCardScenarios,
} from './atmEjectCardSpecification';
import {
  developmentReportSchema,
  type DevelopmentBehaviorReport,
  type DevelopmentOperation,
  type DevelopmentRegistration,
} from './types';
import {
  AIRPORT_CREATE_STAFF_ID,
  AIRPORT_CREATE_STAFF_VERSION,
  AIRPORT_CREATE_STAFF_CLOCK,
  airportCreateStaffSources,
  airportCreateStaffObligations,
  airportCreateStaffScenarios,
  airportCreateStaffScenarioObligations,
} from './airportCreateStaffSpecification';
import {
  COCOME_ITEM_CLOCK,
  cocomeItemSources,
  cocomeItemSpecifications,
  cocomeItemScenarios,
  type CocomeItemOperation,
} from './cocomeItemSpecification';
import {
  LOAN_PAYMENT_ID,
  LOAN_PAYMENT_VERSION,
  LOAN_PAYMENT_CLOCK,
  loanPaymentSources,
  loanPaymentObligations,
  loanPaymentScenarios,
} from './loanPaymentSpecification';

import {
  SUBMITTED_REQUESTS_ID,
  SUBMITTED_REQUESTS_VERSION,
  SUBMITTED_REQUESTS_CLOCK,
  submittedRequestsSources,
  submittedRequestsObligations,
  submittedRequestsScenarios,
} from './submittedLoanRequestsSpecification';

import {
  COCOME_QUERIES_CLOCK,
  cocomeQueriesSources,
  cocomeQuerySpecifications,
  cocomeQueryScenarios,
  type CocomeQueryOperation,
} from './cocomeQueriesSpecification';

import {
  COCOME_MODIFICATIONS_CLOCK,
  cocomeModificationsSources,
  cocomeModificationSpecifications,
  cocomeModificationScenarios,
  type CocomeModificationOperation,
} from './cocomeModificationsSpecification';

import {
  COCOME_DELETIONS_CLOCK,
  cocomeDeletionsSources,
  cocomeDeletionSpecifications,
  cocomeDeletionScenarios,
  type CocomeDeletionOperation,
} from './cocomeDeletionsSpecification';
import {
  AIRPORT_REPAIR_CLOCK, airportRepairSources, airportCreateDeviceDecisionSource, airportV4DecisionSource, airportRepairSpecifications, airportRepairScenarios,
  type AirportRepairOperation,
} from './airportRepairSpecification';
import {crudExtensionAdapters} from './crudExtension';
import {atmInputCardRegistration} from './atmInputCard';
import {recommendationRegistration} from './recommendedBooks';
import {cocomeAggregationRegistration} from './cocomeAggregation';
import {libraryAlignmentRegistration} from './libraryAlignment';
import {atmSessionRegistration} from './atmSession';
import {atmTransactionRegistration} from './atmTransaction';
import {cocomeStockRegistration} from './cocomeStock';
import {cocomeCreationRegistration} from './cocomeCreation';
import {librarySearchRegistration} from './librarySearch';
import {libraryLoanHistoryRegistration} from './libraryLoanHistory';
import {libraryNotificationRegistration} from './libraryNotification';
import {reservationRegistration} from './libraryReservation';
import {addBookCopyRegistration} from './libraryAddBookCopy';
import {libraryFeePayment} from './libraryFeePayment';
import {recommendationCreation} from './libraryRecommendationCreation';
import {libraryRenewal} from './libraryRenewal';
import {loanRequestSelectionRegistration} from './loanRequestSelection';
import {loanValidatedRequests,loanStatusListRegistration} from './loanValidatedRequests';
import {loanAssociatedHistoryRegistration} from './loanAssociatedHistory';
import {loanAvailableTerms} from './loanAvailableTerms';
import {loanDocumentCreationRegistration} from './loanDocumentCreation';
import {loanSubmissionRegistration} from './loanSubmission';
import {cocomeOrderItem} from './cocomeOrderItem';
import {cocomeEnterItem, cocomeCashPayment} from './cocomeSaleFlow';

const airportRepairRegistration = (operation: AirportRepairOperation): DevelopmentRegistration => {
  const spec = airportRepairSpecifications[operation];
  return {
    id: spec.id, project: 'Airport', useCase: spec.useCase, operation,
    schemaVersion: spec.schemaVersion, reviewStatus: 'pending-user-review', fixedClock: AIRPORT_REPAIR_CLOCK,
    sources: operation === 'createDevice' ? [...airportRepairSources, airportCreateDeviceDecisionSource]
      : operation === 'finishRepair' ? [...airportRepairSources, airportV4DecisionSource] : airportRepairSources,
    requirementSourceId: 'requirement-document', modelSourceId: 'upstream-model',
    obligations: spec.obligations, scenarios: airportRepairScenarios[operation].map(({id, obligationIds}) => ({id, obligationIds})),
    moduleExports: {Staff: 'function', Device: 'function', Repair: 'function', ApprovalHistory: 'function',
      [operation === 'createDevice' ? 'AirportSystem_AutoGenerated' : 'RepairService_AutoGenerated']: 'function',
      getRepository: 'function'},
    run: async (candidate, options) => {
      const {runAirportRepairDevelopment} = await import('./airportRepair');
      return runAirportRepairDevelopment(candidate as import('./airportRepair').AirportRepairModule, options, operation);
    },
  };
};

const identity = (operation: DevelopmentOperation) =>
  JSON.stringify([operation.project, operation.useCase, operation.operation]);
function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Development registry: ${message}`);
}

export function createDevelopmentRegistry(entries: readonly DevelopmentRegistration[]) {
  const byId = new Map<string, DevelopmentRegistration>();
  const byOperation = new Map<string, DevelopmentRegistration>();
  for (const entry of entries) {
    ensure(
      entry.id && entry.project && entry.useCase && entry.operation,
      'missing operation identity'
    );
    ensure(
      !byId.has(entry.id) && !byOperation.has(identity(entry)),
      `duplicate operation ${entry.id}`
    );
    ensure(
      entry.schemaVersion && entry.reviewStatus && Number.isFinite(Date.parse(entry.fixedClock)),
      `missing protocol metadata for ${entry.id}`
    );
    const sourceIds = new Set(entry.sources.map((item) => item.id));
    ensure(
      sourceIds.size === entry.sources.length &&
        sourceIds.has(entry.requirementSourceId) &&
        sourceIds.has(entry.modelSourceId),
      `missing or duplicate sources for ${entry.id}`
    );
    ensure(
      entry.sources.every((item) => item.id && item.path && /^[a-f0-9]{64}$/.test(item.sha256)),
      `invalid source hash for ${entry.id}`
    );
    const obligations = new Set(entry.obligations.map((item) => item.id));
    ensure(
      obligations.size > 0 && obligations.size === entry.obligations.length,
      `missing or duplicate obligations for ${entry.id}`
    );
    ensure(
      entry.obligations.every(
        (item) =>
          item.id &&
          item.requirement.trim() &&
          ['precondition', 'postcondition'].includes(item.clause) &&
          Number.isInteger(item.documentLine) &&
          item.documentLine > 0 &&
          (!item.requirementSourceId || sourceIds.has(item.requirementSourceId)) &&
          item.modelLines.every(Number.isInteger) &&
          item.modelLines[0] > 0 &&
          item.modelLines[1] >= item.modelLines[0] &&
          item.modelFeatures.length > 0 &&
          (item.localizationTargets === undefined ||
            (item.localizationTargets.length > 0 &&
              new Set(item.localizationTargets).size === item.localizationTargets.length &&
              item.localizationTargets.every((name) => item.modelFeatures.includes(name))))
      ),
      `invalid obligation evidence for ${entry.id}`
    );
    const scenarios = new Set(entry.scenarios.map((item) => item.id));
    ensure(
      scenarios.size > 0 && scenarios.size === entry.scenarios.length,
      `missing or duplicate scenarios for ${entry.id}`
    );
    ensure(
      entry.scenarios.every(
        (item) =>
          item.id &&
          item.obligationIds.length > 0 &&
          new Set(item.obligationIds).size === item.obligationIds.length &&
          item.obligationIds.every((id) => obligations.has(id))
      ),
      `unknown or empty scenario obligations for ${entry.id}`
    );
    ensure(
      entry.obligations.every((item) =>
        entry.scenarios.some((scenario) => scenario.obligationIds.includes(item.id))
      ),
      `uncovered registered obligation for ${entry.id}`
    );
    ensure(
      Object.keys(entry.moduleExports).length > 0 && typeof entry.run === 'function',
      `missing runner for ${entry.id}`
    );
    byId.set(entry.id, entry);
    byOperation.set(identity(entry), entry);
  }
  return {
    list: () => [...byId.values()],
    require: (operation: string | DevelopmentOperation) => {
      const entry =
        typeof operation === 'string' ? byId.get(operation) : byOperation.get(identity(operation));
      if (!entry)
        throw new Error(
          `No registered development behavior for ${typeof operation === 'string' ? operation : identity(operation)}; source obligations and scenarios must be registered before enabling repair.`
        );
      return entry;
    },
  };
}

const cocomeItemRegistration = (operation: CocomeItemOperation): DevelopmentRegistration => {
  const specification = cocomeItemSpecifications[operation];
  return {
    id: specification.id,
    project: 'CoCoME',
    useCase: 'manageItem',
    operation,
    schemaVersion: specification.schemaVersion,
    reviewStatus: 'pending-user-review',
    fixedClock: COCOME_ITEM_CLOCK,
    sources: cocomeItemSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: specification.obligations,
    scenarios: cocomeItemScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.hasTarget
        ? specification.obligations.map((item) => item.id)
        : ['P01'],
    })),
    moduleExports: {
      Item: 'function',
      ManageItemCRUDService_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runCocomeItemDevelopment} = await import('./cocomeItem');
      return runCocomeItemDevelopment(
        candidate as import('./cocomeItem').CocomeItemModule,
        options,
        operation
      );
    },
  };
};

const cocomeQueryRegistration = (operation: CocomeQueryOperation): DevelopmentRegistration => {
  const spec = cocomeQuerySpecifications[operation];
  return {
    id: spec.id,
    project: 'CoCoME',
    useCase: spec.useCase,
    operation,
    schemaVersion: spec.schemaVersion,
    reviewStatus: 'pending-user-review',
    fixedClock: COCOME_QUERIES_CLOCK,
    sources: cocomeQueriesSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: spec.obligations,
    scenarios: cocomeQueryScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.hasTarget ? ['P01', 'Q01'] : ['P01'],
    })),
    moduleExports: {
      [spec.entity]: 'function',
      [`${spec.service}_AutoGenerated`]: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runCocomeQueryDevelopment} = await import('./cocomeQueries');
      return runCocomeQueryDevelopment(
        candidate as import('./cocomeQueries').CocomeQueriesModule,
        options,
        operation
      );
    },
  };
};

const cocomeModificationRegistration = (
  operation: CocomeModificationOperation
): DevelopmentRegistration => {
  const spec = cocomeModificationSpecifications[operation];
  return {
    id: spec.id,
    project: 'CoCoME',
    useCase: spec.useCase,
    operation,
    schemaVersion: spec.schemaVersion,
    reviewStatus: 'pending-user-review',
    fixedClock: COCOME_MODIFICATIONS_CLOCK,
    sources: cocomeModificationsSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: spec.obligations,
    scenarios: cocomeModificationScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.hasTarget ? spec.obligations.map((item) => item.id) : ['P01'],
    })),
    moduleExports: {
      [spec.entity]: 'function',
      [`${spec.service}_AutoGenerated`]: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runCocomeModificationDevelopment} = await import('./cocomeModifications');
      return runCocomeModificationDevelopment(
        candidate as import('./cocomeModifications').CocomeModificationsModule,
        options,
        operation
      );
    },
  };
};

const cocomeDeletionRegistration = (
  operation: CocomeDeletionOperation
): DevelopmentRegistration => {
  const spec = cocomeDeletionSpecifications[operation];
  return {
    id: spec.id,
    project: 'CoCoME',
    useCase: spec.useCase,
    operation,
    schemaVersion: spec.schemaVersion,
    reviewStatus: 'pending-user-review',
    fixedClock: COCOME_DELETIONS_CLOCK,
    sources: cocomeDeletionsSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: spec.obligations,
    scenarios: cocomeDeletionScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.hasTarget ? ['P01', 'Q01', 'Q02'] : ['P01'],
    })),
    moduleExports: {
      [spec.entity]: 'function',
      [`${spec.service}_AutoGenerated`]: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runCocomeDeletionDevelopment} = await import('./cocomeDeletions');
      return runCocomeDeletionDevelopment(
        candidate as import('./cocomeDeletions').CocomeDeletionsModule,
        options,
        operation
      );
    },
  };
};

const transitionRegistration = (operation: StateTransitionOperation): DevelopmentRegistration => {
  const spec = stateTransitionSpecifications[operation];
  return {
    id: spec.id,
    project: spec.project,
    useCase: spec.useCase,
    operation,
    schemaVersion: spec.schemaVersion,
    reviewStatus: 'pending-user-review',
    fixedClock: STATE_TRANSITION_CLOCK,
    sources: spec.sources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: spec.obligations,
    scenarios: transitionScenarios(spec).map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.rejectObligation
        ? [scenario.rejectObligation]
        : spec.obligations.map((item) => item.id),
    })),
    moduleExports: {
      [spec.entity]: 'function',
      [`${spec.service}_AutoGenerated`]: 'function',
      getRepository: 'function',
      ...(spec.parentStore ? {Store: 'function' as const} : {}),
      ...(spec.entity === 'Loan' ? {LoanStatus: 'object' as const} : {}),
    },
    run: async (candidate, options) => {
      const {runStateTransitionDevelopment} = await import('./stateTransitions');
      return runStateTransitionDevelopment(
        candidate as import('./stateTransitions').TransitionModule,
        options,
        operation
      );
    },
  };
};

const adapters: Record<string, DevelopmentRegistration> = {
  transitionOpenStore: transitionRegistration('openStore'),
  transitionCloseStore: transitionRegistration('closeStore'),
  transitionOpenCashDesk: transitionRegistration('openCashDesk'),
  transitionCloseCashDesk: transitionRegistration('closeCashDesk'),
  transitionCloseOutLoan: transitionRegistration('closeOutLoan'),
  cocomeDeleteStore: cocomeDeletionRegistration('deleteStore'),
  cocomeDeleteProductCatalog: cocomeDeletionRegistration('deleteProductCatalog'),
  cocomeDeleteCashDesk: cocomeDeletionRegistration('deleteCashDesk'),
  cocomeDeleteCashier: cocomeDeletionRegistration('deleteCashier'),
  cocomeDeleteSupplier: cocomeDeletionRegistration('deleteSupplier'),
  cocomeModifyStore: cocomeModificationRegistration('modifyStore'),
  cocomeModifyProductCatalog: cocomeModificationRegistration('modifyProductCatalog'),
  cocomeModifyCashDesk: cocomeModificationRegistration('modifyCashDesk'),
  cocomeModifyCashier: cocomeModificationRegistration('modifyCashier'),
  cocomeModifySupplier: cocomeModificationRegistration('modifySupplier'),
  cocomeQueryStore: cocomeQueryRegistration('queryStore'),
  cocomeQueryProductCatalog: cocomeQueryRegistration('queryProductCatalog'),
  cocomeQueryCashDesk: cocomeQueryRegistration('queryCashDesk'),
  cocomeQueryCashier: cocomeQueryRegistration('queryCashier'),
  cocomeQuerySupplier: cocomeQueryRegistration('querySupplier'),
  submittedLoanRequests: {
    id: SUBMITTED_REQUESTS_ID,
    project: 'LoanProcessingSystem',
    useCase: 'enterValidatedCreditReferences',
    operation: 'listSubmitedLoanRequest',
    schemaVersion: SUBMITTED_REQUESTS_VERSION,
    reviewStatus: 'pending-user-review',
    fixedClock: SUBMITTED_REQUESTS_CLOCK,
    sources: submittedRequestsSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: submittedRequestsObligations,
    scenarios: submittedRequestsScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.rejectObligation
        ? [scenario.rejectObligation]
        : submittedRequestsObligations.map((item) => item.id),
    })),
    moduleExports: {
      LoanRequest: 'function',
      LoanRequestStatus: 'object',
      EnterValidatedCreditReferencesModule_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runSubmittedRequestsDevelopment} = await import('./submittedLoanRequests');
      return runSubmittedRequestsDevelopment(
        candidate as import('./submittedLoanRequests').SubmittedRequestsModule,
        options
      );
    },
  },
  addLoanTerm: {
    id: ADD_LOAN_TERM_ID,
    project: 'LoanProcessingSystem',
    useCase: 'evaluateLoanRequest',
    operation: 'addLoanTerm',
    schemaVersion: ADD_LOAN_TERM_VERSION,
    reviewStatus: 'pending-user-review',
    fixedClock: '2026-01-15T12:00:00+08:00',
    sources: addLoanTermSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: addLoanTermObligations,
    scenarios: addLoanTermScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.rejectObligation
        ? [scenario.rejectObligation]
        : addLoanTermObligations.map((item) => item.id),
    })),
    moduleExports: {
      LoanRequest: 'function',
      LoanTerm: 'function',
      EvaluateLoanRequestModule_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runAddLoanTermDevelopment} = await import('./addLoanTerm');
      return runAddLoanTermDevelopment(
        candidate as import('./addLoanTerm').AddLoanTermModule,
        options
      );
    },
  },
  loanPayment: {
    id: LOAN_PAYMENT_ID,
    project: 'LoanProcessingSystem',
    useCase: 'loanPayment',
    operation: 'loanPayment',
    schemaVersion: LOAN_PAYMENT_VERSION,
    reviewStatus: 'pending-user-review',
    fixedClock: LOAN_PAYMENT_CLOCK,
    sources: loanPaymentSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: loanPaymentObligations,
    scenarios: loanPaymentScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.rejectObligation
        ? [scenario.rejectObligation]
        : loanPaymentObligations.map((item) => item.id),
    })),
    moduleExports: {
      Loan: 'function',
      LoanStatus: 'object',
      LoanProcessingSystemSystem_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runLoanPaymentDevelopment} = await import('./loanPayment');
      return runLoanPaymentDevelopment(
        candidate as import('./loanPayment').LoanPaymentModule,
        options
      );
    },
  },
  cocomeQueryItem: cocomeItemRegistration('queryItem'),
  cocomeDeleteItem: cocomeItemRegistration('deleteItem'),
  airportCreateStaff: {
    id: AIRPORT_CREATE_STAFF_ID,
    project: 'Airport',
    useCase: 'manageUser',
    operation: 'createStaff',
    schemaVersion: AIRPORT_CREATE_STAFF_VERSION,
    reviewStatus: 'pending-user-review',
    fixedClock: AIRPORT_CREATE_STAFF_CLOCK,
    sources: airportCreateStaffSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: airportCreateStaffObligations,
    scenarios: airportCreateStaffScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: airportCreateStaffScenarioObligations(scenario),
    })),
    moduleExports: {
      Staff: 'function',
      AirportSystem_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runAirportCreateStaffDevelopment} = await import('./airportCreateStaff');
      return runAirportCreateStaffDevelopment(
        candidate as import('./airportCreateStaff').AirportCreateStaffModule,
        options
      );
    },
  },
  atmEjectCard: {
    id: ATM_EJECT_CARD_ID,
    project: 'AutomatedTellerMachine',
    useCase: 'checkBalance',
    operation: 'ejectCard',
    schemaVersion: ATM_EJECT_CARD_VERSION,
    reviewStatus: 'pending-user-review',
    fixedClock: ATM_EJECT_CARD_CLOCK,
    sources: atmEjectCardSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: atmEjectCardObligations,
    scenarios: atmEjectCardScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.rejectObligation
        ? [scenario.rejectObligation]
        : atmEjectCardObligations.map((item) => item.id),
    })),
    moduleExports: {
      BankCard: 'function',
      User: 'function',
      CardStatus: 'object',
      CardCatalog: 'object',
      AutomatedTellerMachineSystem_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runAtmEjectCardDevelopment} = await import('./atmEjectCard');
      return runAtmEjectCardDevelopment(
        candidate as import('./atmEjectCard').AtmEjectCardModule,
        options
      );
    },
  },
  borrowBook: {
    id: BORROW_BOOK_ID,
    project: 'LibraryManagementSystem',
    useCase: 'borrowBook',
    operation: 'borrowBook',
    schemaVersion: DEVELOPMENT_BEHAVIOR_VERSION,
    reviewStatus: 'pending-user-review',
    fixedClock: BORROW_BOOK_CLOCK,
    sources: borrowBookSources,
    requirementSourceId: 'requirement-document',
    modelSourceId: 'upstream-model',
    obligations: borrowBookObligations,
    scenarios: borrowBookScenarios.map((scenario) => ({
      id: scenario.id,
      obligationIds: scenario.rejectObligation
        ? [scenario.rejectObligation]
        : borrowBookObligations
            .filter((item) => scenario.copy === 'ONHOLDSHELF' || !['Q10', 'Q11'].includes(item.id))
            .map((item) => item.id),
    })),
    moduleExports: {
      User: 'function',
      Student: 'function',
      Faculty: 'function',
      BookCopy: 'function',
      Loan: 'function',
      Reserve: 'function',
      Programme: 'object',
      BorrowStatus: 'object',
      CopyStatus: 'object',
      LibraryManagementSystemSystem_AutoGenerated: 'function',
      getRepository: 'function',
    },
    run: async (candidate, options) => {
      const {runBorrowBookDevelopment} = await import('./borrowBook');
      return runBorrowBookDevelopment(
        candidate as import('./borrowBook').BorrowBookModule,
        options
      );
    },
  },
};
const configured = z
  .object({
    schemaVersion: z.literal('development-behavior-registry-v1'),
    registrations: z
      .array(
        z
          .object({
            id: z.string().min(1),
            project: z.string().min(1),
            useCase: z.string().min(1),
            operation: z.string().min(1),
            adapter: z.string().min(1),
          })
          .strict()
      )
      .min(1),
  })
  .strict()
  .parse(manifest);

export const DEVELOPMENT_REGISTRY_VERSION = configured.schemaVersion;
const runners: Record<string, DevelopmentRegistration> = {
      libraryBorrowHistory: libraryLoanHistoryRegistration('listBorrowHistory'),
      libraryNotification: libraryNotificationRegistration,
      libraryMakeReservation: reservationRegistration('makeReservation'),
      libraryAddBookCopy: addBookCopyRegistration,
      libraryFeePayment,
      recommendationCreation,
      libraryRenewal,
      loanChooseRequest: loanRequestSelectionRegistration('chooseLoanRequest'),
      loanMarkRequestValid: loanRequestSelectionRegistration('markRequestValid'),
      loanChooseForReview: loanRequestSelectionRegistration('chooseOneForReview'),
      loanApproveRequest: loanRequestSelectionRegistration('approveLoanRequest'),
      loanListValidated: loanValidatedRequests,
      loanCreditHistory: loanAssociatedHistoryRegistration('checkCreditHistory'),
      loanCheckingAccount: loanAssociatedHistoryRegistration('reviewCheckingAccount'),
      loanAvailableTerms,
      loanApprovalLetter: loanDocumentCreationRegistration('genereateApprovalLetter'),
      loanAgreement: loanDocumentCreationRegistration('generateLoanAgreement'),
      loanEnterInformation: loanSubmissionRegistration('enterLoanInformation'),
      loanCalculateScore: loanSubmissionRegistration('calculateScore'),
      cocomeOrderItem,
      cocomeEnterItem,
      cocomeCashPayment,
      loanListApproved: loanStatusListRegistration('listApprovalRequest'),
      libraryCancelReservation: reservationRegistration('cancelReservation'),
      libraryHoldingHistory: libraryLoanHistoryRegistration('listHodingBook'),
      librarySearchBarcode: librarySearchRegistration('searchBookByBarCode'),
      librarySearchTitle: librarySearchRegistration('searchBookByTitle'),
      librarySearchAuthor: librarySearchRegistration('searchBookByAuthor'),
      librarySearchIsbn: librarySearchRegistration('searchBookByISBN'),
      librarySearchSubject: librarySearchRegistration('searchBookBySubject'),
      creationNewOrder: cocomeCreationRegistration('makeNewOrder'),
      creationNewSale: cocomeCreationRegistration('makeNewSale'),
      stockChangePrice: cocomeStockRegistration('changePrice'),
      stockListSuppliers: cocomeStockRegistration('listSuppliers'),
      stockShowReports: cocomeStockRegistration('showStockReports'),
      stockOutOfStock: cocomeStockRegistration('listAllOutOfStoreProducts'),
      stockChooseSupplier: cocomeStockRegistration('chooseSupplier'),
      atmReceiptDeposit: atmTransactionRegistration('receipt-deposit'),
      atmReceiptWithdraw: atmTransactionRegistration('receipt-withdraw'),
      atmEjectDeposit: atmTransactionRegistration('eject-deposit'),
      atmEjectWithdraw: atmTransactionRegistration('eject-withdraw'),
      atmWithdrawCash: atmTransactionRegistration('withdraw'),
      atmPasswordCheck: atmSessionRegistration('password-check'),
      atmPasswordDeposit: atmSessionRegistration('password-deposit'),
      atmPasswordWithdraw: atmSessionRegistration('password-withdraw'),
      atmSessionBalance: atmSessionRegistration('balance'),
      atmSessionDeposit: atmSessionRegistration('deposit'),
      libraryCountdownAlignment: libraryAlignmentRegistration('countDownSuspensionDay'),
      libraryOverdueAlignment: libraryAlignmentRegistration('listOverDueBook'),
      libraryReservationAlignment: libraryAlignmentRegistration('listReservationBook'),
      ...adapters,
      ...crudExtensionAdapters,
      adjudicatedPlaceOrder: cocomeAggregationRegistration('placeOrder'),
      adjudicatedEndSale: cocomeAggregationRegistration('endSale'),
      adjudicatedReceiveOrderedProduct: cocomeAggregationRegistration('receiveOrderedProduct'),
      recommendationHistoryView: recommendationRegistration('listBookHistory'),
      recommendationStandaloneView: recommendationRegistration('listRecommendBook'),
      atmInputCardCheckBalance: atmInputCardRegistration('checkBalance'),
      atmInputCardDepositFunds: atmInputCardRegistration('depositFunds'),
      atmInputCardWithdrawCash: atmInputCardRegistration('withdrawCash'),
      airportCreateDevice: airportRepairRegistration('createDevice'),
      airportApprove: airportRepairRegistration('approve'),
      airportFinishRepair: airportRepairRegistration('finishRepair'),
      airportFeedback: airportRepairRegistration('feedback'),
};
export const developmentRegistry = createDevelopmentRegistry(
  configured.registrations.map(({adapter, ...operation}) => {
    ensure(Object.hasOwn(runners, adapter), `unknown runner adapter ${adapter}`);
    // An adapter cannot be silently relabeled as another operation's validator.
    ensure(
      operation.id === runners[adapter].id && identity(operation) === identity(runners[adapter]),
      'adapter identity mismatch'
    );
    return runners[adapter];
  })
);

export function verifyDevelopmentSources(entry: DevelopmentRegistration, root = process.cwd()) {
  const sourceText = new Map<string, string>();
  const verified = entry.sources.map((source) => {
    const file = path.resolve(root, source.path);
    const relative = path.relative(path.resolve(root), file);
    ensure(
      relative && !relative.startsWith('..') && !path.isAbsolute(relative),
      `out-of-tree source ${source.path}`
    );
    const bytes = fs.readFileSync(file);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    ensure(sha256 === source.sha256, `source evidence changed: ${source.path}`);
    sourceText.set(source.id, bytes.toString('utf8'));
    return {...source, sha256};
  });
  const modelLines = sourceText.get(entry.modelSourceId)!.split(/\r?\n/).length;
  ensure(
    entry.obligations.every((item) => {
      const source = sourceText.get(item.requirementSourceId ?? entry.requirementSourceId);
      return (
        Boolean(source) &&
        item.documentLine <= source!.split(/\r?\n/).length &&
        item.modelLines[1] <= modelLines
      );
    }),
    `source location out of range for ${entry.id}`
  );
  return verified;
}

export function validateDevelopmentReport(
  value: unknown,
  entry: DevelopmentRegistration
): DevelopmentBehaviorReport {
  const report = developmentReportSchema.parse(value);
  ensure(report.dynamicRepairEnabled === false, 'worker cannot claim to enable repair');
  ensure(
    report.operationId === entry.id &&
      report.schemaVersion === entry.schemaVersion &&
      report.reviewStatus === entry.reviewStatus,
    'worker report identity or protocol mismatch'
  );
  const scenarios = new Map(entry.scenarios.map((item) => [item.id, item]));
  const ids = new Set(entry.obligations.map((item) => item.id));
  const knownCheck = (scenarioId: string, obligationId: string) =>
    scenarios.get(scenarioId)?.obligationIds.includes(obligationId);
  ensure(
    report.scenarioCount === scenarios.size &&
      report.scenarioResults.length === scenarios.size &&
      new Set(report.scenarioResults.map((item) => item.id)).size === scenarios.size &&
      report.scenarioResults.every((item) => scenarios.has(item.id)),
    'missing, duplicate or foreign scenario results'
  );
  ensure(
    report.checks.every((item) => knownCheck(item.scenarioId, item.obligationId)) &&
      new Set(report.checks.map((item) => JSON.stringify([item.scenarioId, item.obligationId])))
        .size === report.checks.length,
    'unknown or duplicate checks'
  );
  ensure(
    report.diagnostics.every(
      (item) =>
        scenarios.has(item.scenarioId) &&
        item.obligationIds.every((id) => ids.has(id) && knownCheck(item.scenarioId, id))
    ),
    'unknown diagnostic scope'
  );
  ensure(
    report.scenarioResults.every(
      (item) =>
        item.checkCount === report.checks.filter((check) => check.scenarioId === item.id).length &&
        item.passed === !report.diagnostics.some((diagnostic) => diagnostic.scenarioId === item.id)
    ),
    'scenario result disagrees with observations'
  );
  ensure(
    report.executionObservations.length === scenarios.size &&
      new Set(report.executionObservations.map((item) => item.scenarioId)).size ===
        scenarios.size &&
      report.executionObservations.every((item) => scenarios.has(item.scenarioId)),
    'missing or foreign execution observations'
  );
  for (const observation of report.executionObservations) {
    const evidence = observation.rejectionEvidence;
    if (evidence) ensure(observation.classification === 'definition-failure-unresolved' &&
      observation.conventionStatus === 'matched' &&
      entry.obligations.some(item => item.id === evidence.obligationId && item.clause === 'precondition') &&
      report.checks.some(item => item.scenarioId === observation.scenarioId && item.obligationId === evidence.obligationId && item.passed === true),
    'confirmed rejection lacks an independently observed registered precondition');
    if (observation.classification === 'postcondition-check-failure') ensure(
      report.checks.some(check => check.scenarioId === observation.scenarioId && check.passed === false &&
        entry.obligations.some(item => item.id === check.obligationId && item.clause === 'postcondition' && !item.modelFeatures.includes('$result'))),
      'PostCheck business diagnosis lacks an independent state mismatch');
  }
  const observed = new Set(
    report.checks.filter((item) => item.passed !== null).map((item) => item.obligationId)
  );
  const unobserved = entry.obligations
    .filter((item) => !observed.has(item.id))
    .map((item) => item.id);
  ensure(
    report.unobservedObligationIds.length === unobserved.length &&
      new Set(report.unobservedObligationIds).size === unobserved.length &&
      report.unobservedObligationIds.every((id) => unobserved.includes(id)),
    'incorrect obligation coverage'
  );
  const businessStatus = report.diagnostics.some((item) =>
    ['OBLIGATION_MISMATCH', 'SPECIFICATION_DETAIL_MISMATCH', 'UNEXPECTED_REJECTION'].includes(
      item.code
    )
  )
    ? 'mismatched'
    : report.diagnostics.length
      ? 'inconclusive'
      : 'matched';
  const conventionStatus = report.executionObservations.some(
    (item) => item.conventionStatus === 'mismatched'
  )
    ? 'mismatched'
    : report.executionObservations.some((item) => item.conventionStatus === 'inconclusive')
      ? 'inconclusive'
      : 'matched';
  ensure(
    report.businessStatus === businessStatus &&
      report.executionConventionStatus === conventionStatus,
    'assessment status disagrees with evidence'
  );
  const expectedPass =
    businessStatus === 'matched' && conventionStatus === 'matched' && report.checks.length > 0;
  ensure(report.passed === expectedPass, 'pass status disagrees with evidence');
  if (report.passed)
    ensure(
      entry.scenarios.every((scenario) =>
        scenario.obligationIds.every((id) =>
          report.checks.some(
            (check) =>
              check.scenarioId === scenario.id && check.obligationId === id && check.passed === true
          )
        )
      ),
      'passing report omitted registered checks'
    );
  return report;
}

export async function runRegisteredDevelopment(
  entry: DevelopmentRegistration,
  candidate: unknown,
  requirementText: string
) {
  ensure(
    candidate &&
      typeof candidate === 'object' &&
      Object.entries(entry.moduleExports).every(
        ([name, kind]) =>
          candidate !== null &&
          name in candidate &&
          typeof (candidate as Record<string, unknown>)[name] === kind &&
          (candidate as Record<string, unknown>)[name] !== null
      ),
    `candidate module exports mismatch for ${entry.id}`
  );
  ensure(requirementText.trim(), 'actual generation requirement is required');
  return validateDevelopmentReport(await entry.run(candidate, {requirementText}), entry);
}
