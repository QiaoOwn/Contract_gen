# ContractGen 114-Operation V2 Revision Audit

## Scope and Release Gate

This is an evidence-constrained annotation revision, not a new experiment and not a claim that the benchmark is publication-ready.
All 114 original operations were processed in original Project / Use Case / Operation order, with one completed use-case audit before the next (47 use cases, 5 projects, one RM2PT source family). No external USE dataset is mixed in.

**VERIFIED is STATIC verification only:** the recovered NL is consistent with the available encoded Operation reference and reviewed scenario declarations. For the explicitly source-pinned subset, the corresponding original RM2PT formal operation specification was also inspected. VERIFIED does not mean independent human confirmation, exhaustive behavioral coverage, standard-OCL conformance or successful generation/runtime execution.
Original RM2PT formal specifications were pinned to commit 3c08c41dc8671f857169e82cce662a075a306aa3 and reviewed for 26 operations across 5 project model files. The remaining operations retain local encoded-reference scope only. RM2DOC prose embedded beside the formal contracts is generated documentation, not independent natural-language evidence. Author-maintained Jest corroborates the contracts but is not independent ground truth.
NEEDS_REVIEW means additional oracle/representation/fixture review is needed. NEEDS_SOURCE means a concrete semantic conflict, missing effect, stub or unresolved source interpretation prevents a complete reliable requirement; such references remain empty, with candidate pointers retained.

## Summary

| Measure | Count |
|---|---:|
| Total operations | 114 |
| VERIFIED | 106 |
| NEEDS_REVIEW | 0 |
| NEEDS_SOURCE | 8 |
| Easy | 25 |
| Medium | 57 |
| Hard | 24 |
| Difficulty unresolved (null, not silently Easy) | 8 |
| Accepted local reference mappings | 106 |
| Unaccepted reference candidates | 8 |
| Operations mapped to Jest sources | 114 |
| Distinct Jest files | 107 |
| Distinct scenario declarations | 243 |
| Statically expanded cases in distinct declarations | 251 |
| Declarations with unknown expansion count | 0 |
| Evidence-anchored intent/pre/post clauses | 780 |
| Operations with pinned original RM2PT formal specification review | 26 |
| Distinct pinned RM2PT model files used | 5 |
| Operations using source-aligned V2 oracle copies | 16 |
| Distinct source-aligned V2 oracle files | 14 |
| New model/runtime experiments executed | 0 |

Parameterized test declarations are counted separately from their static case expansion. Shared ATM operations map to the same test files and are not counted as independent tests. A mapped declaration does not imply every clause is asserted.

### By Project

| Project | Operations | VERIFIED | NEEDS_REVIEW | NEEDS_SOURCE |
|---|---:|---:|---:|---:|
| Airport | 5 | 5 | 0 | 0 |
| AutomatedTellerMachine | 22 | 22 | 0 | 0 |
| CoCoME | 41 | 36 | 0 | 5 |
| LibraryManagementSystem | 24 | 21 | 0 | 3 |
| LoanProcessingSystem | 22 | 22 | 0 | 0 |

### Preserved Signature Distributions

| Parameter count | Operations |
|---:|---:|
| 0 | 23 |
| 1 | 53 |
| 2 | 16 |
| 3 | 7 |
| 4 | 6 |
| 5 | 4 |
| 6 | 1 |
| 8 | 2 |
| 10 | 1 |
| 13 | 1 |

| Return type (unchanged) | Operations |
|---|---:|
| ApprovalHistory | 1 |
| BankCard | 1 |
| Boolean | 76 |
| CashDesk | 1 |
| Cashier | 1 |
| CheckingAccount | 1 |
| CreditHistory | 1 |
| Integer | 1 |
| Item | 1 |
| LoanRequest | 2 |
| LoanTerm | 1 |
| ProductCatalog | 1 |
| Real | 4 |
| Set(Book) | 5 |
| Set(BookCopy) | 2 |
| Set(Item) | 2 |
| Set(Loan) | 2 |
| Set(LoanRequest) | 3 |
| Set(LoanTerm) | 1 |
| Set(RecommendBook) | 2 |
| Set(Supplier) | 1 |
| Store | 1 |
| Supplier | 1 |
| User | 1 |
| void | 1 |

## Semantic Features and Difficulty

Feature counts are multi-label. The all-record column includes known features of partially unresolved source candidates, not completed requirements. The VERIFIED column is local-static only. No feature is added merely to increase difficulty.

| Feature | All 114 | Local VERIFIED subset |
|---|---:|---:|
| association_add | 15 | 13 |
| association_remove | 0 | 0 |
| attribute_update | 28 | 25 |
| collection_operation | 35 | 27 |
| conditional_effect | 14 | 13 |
| multi_object_effect | 15 | 11 |
| object_creation | 29 | 27 |
| object_deletion | 9 | 9 |
| pre_state_relation | 10 | 7 |
| query | 32 | 30 |
| recursive_or_nested_call | 0 | 0 |
| result_constraint | 113 | 106 |
| state_transition | 21 | 16 |
| temporary_state | 24 | 24 |

Difficulty was reassessed from actual obligations rather than copied from the guide's provisional labels. Simple lookups/field effects are Easy; ordinary creation/deletion or several independent updates are Medium; branches, coupled associations/multiple objects and richer session workflows are Hard. Every record carries its specific rationale. The 8 unresolved records retain null rather than an invented final label.
No association-removal or recursive-call requirement was invented to fill an empty category. Closing a reservation is not deleting it; removing a repository member is not an unproven cascade.

## Source Fidelity and Input Boundary

- All protected fields, including original IDs, order, signatures, parameters, return types, model_context and description_original, compare equal to the byte-preserved starting scaffold.
- Parameters and return types also match all 114 local Operation declarations. This is a local cross-check, not permission to rewrite upstream metadata.
- Accepted reference sections are exact decoded strings from existing TypeScript literals. They were neither generated nor repaired. Source paths, line ranges and SHA-256 hashes are recorded.
- Every new intent/pre/post clause has an exact source anchor; definitions are separately pinned as binding context. Whole-field source locations preserve the enclosing branches, not just isolated matched substrings.
- Structured requirement fields contain no detected generic templates or OCL surface syntax. This check does not prove absence of all forms of semantic leakage.
- This file is an annotation/master artifact, not a directly safe prompt payload. Exclude reference_contract, clause_evidence, binding_context_evidence, semantic_feature_evidence, provenance, audit notes and description_original from generation input.
- No experimental model API calls or new reference contracts were generated. Source-aligned V2 oracle copies were created only where historical assertions exceeded the cited contract (for example array identity/order); every patch and reason is recorded. Historical Jest files, OCLTSVM, source Operation modules, results and data/operations.jsonl were not changed.

### Legacy Description

Generic template records: structured V2 NL **0**, preserved description_original **108**, retained legacy description **108**.
The original description and description_original remain unchanged for traceability. Only locally VERIFIED records are eligible for the separately generated description view; unresolved records are excluded. All generation_ready flags remain false because current-runner compatibility is a separate gate. See data/operation_revision/experiment_readiness.md. Do not rerun the old description-only pipeline and call that a V2 experiment.

## Substantive Reconstruction

The 108 RECONSTRUCT FROM SOURCE records now have source-linked structured text, although some remain partial. The six KEEP + NORMALIZE records preserve existing meaning; numeric thresholds, dates and missing effects were added only where local evidence supports them. Conflicting parts were withheld and documented, not silently replaced.

| Original category | Count |
|---|---:|
| KEEP + NORMALIZE | 6 |
| RECONSTRUCT FROM SOURCE | 108 |

The complete per-operation inventory below identifies exactly which records were reconstructed versus normalized.

## NEEDS_SOURCE: Specific Missing Evidence

### CoCoME_orderProducts_orderItem
- Confirm the required session invariant or the operation's behavior when CurrentOrderProduct is absent. The retrieved original specification also lacks this guard. Confirm the upstream subAmount versus local SubAmount adaptation without silently changing the frozen model context.

### CoCoME_orderProducts_placeOrder
- Author confirmation is required for the intended total calculation: the original per-entry previous-amount equations differ from the local sum repair. Also confirm whether equal subtotals contribute per entry. No total-calculation requirement or corrected reference is invented.
- Conflict: Original: one previous-amount equation per entry. Local: previous amount plus summed collected subtotals. These are not equivalent for ordinary multi-entry orders.

### CoCoME_processSale_endSale
- Confirm whether the total counts each sales line or each distinct subtotal value. The original Set/collect formulation and its generated documentation do not independently resolve multiplicity; existing tests use distinct subtotals only.

### CoCoME_processSale_makeCashPayment
- Provide or confirm the session invariant guaranteeing CurrentStore before payment, or specify failure behavior when it is missing. The retrieved original formal contract has the same missing guard; test setup is not sufficient evidence to invent one.

### CoCoME_receiveOrderedProduct_receiveOrderedProduct
- Confirm an order-entry uniqueness invariant or a different intended receipt rule for repeated Item references. The original and local contracts both contain potentially conflicting per-entry equations against one pre-state.

### LibraryManagementSystem_countDownSuspensionDay_countDownSuspensionDay
- The pinned RM2PT specification requires an authoritative clarification of the conditional transition timing: whether SUSPEND, zero fee and zero remaining days are evaluated before or after decrementing the suspension duration.

### LibraryManagementSystem_listBookHistory_listOverDueBook
- The pinned RM2PT specification does not resolve the declared Set(BookCopy) result against potentially repeated LoanedCopy values. A domain uniqueness invariant or an authoritative deduplication rule is required.

### LibraryManagementSystem_listBookHistory_listReservationBook
- The pinned RM2PT specification does not resolve the declared Set(BookCopy) result against potentially repeated ReservedCopy values. A domain uniqueness invariant or an authoritative deduplication rule is required.

## NEEDS_REVIEW: Oracle and Representation Issues

## Source Reinspection Findings

These findings clarify local implementation or test interpretation; they do not silently add business requirements or certify upstream fidelity.

- **LoanProcessingSystem_evaluateLoanRequest_addLoanTerm**: The misleading test title is resolved by the actual setup and assertion: the second call uses a fresh service without CurrentLoanRequest. It tests the explicit session-existence precondition, not duplicate-identifier rejection. No duplicate guard or business effect is added; the existing requirement is locally consistent. The test title is left unchanged to preserve historical oracle files. Evidence: test/LoanProcessingSystem-EvaluateLoanRequestModule-addLoanTerm/index.test.ts:51, src/rm2pt/project/LoanProcessingSystem/evaluateLoanRequest.ts:83.

## Reference and Jest Mapping Gaps

No local reference candidate mapping: 0. No Jest scenario mapping: 0.
A pointer is not acceptance: 8 candidates are deliberately not installed in reference_contract; their IDs and reasons are listed under NEEDS_SOURCE. Pinned upstream formal provenance is present for 26 operations only; no broader native-fidelity claim is made.
No USE file or generated model output was substituted as reference evidence. The duplicate named ATM operations remain distinct original IDs, but share corroborating test files.

## Use-Case Fidelity Audit Trail

The machine-readable trail is data/operation_revision/use_case_audits.jsonl. Each operation stores original-description, reference, effect-completeness, scenario-obligation and leakage checks. Later annotation corrections are recorded as superseded annotation hashes, not erased. Audits are static; they do not assert scenario execution success.

| Sequence | Project / Use case | Operations | Unresolved records |
|---:|---|---:|---:|
| 1 | Airport / manageDevice | 1 | 0 |
| 2 | Airport / manageUser | 1 | 0 |
| 3 | Airport / raiseRepair | 3 | 0 |
| 4 | AutomatedTellerMachine / checkBalance | 4 | 0 |
| 5 | AutomatedTellerMachine / depositFunds | 5 | 0 |
| 6 | AutomatedTellerMachine / manageBankCard | 4 | 0 |
| 7 | AutomatedTellerMachine / manageUser | 4 | 0 |
| 8 | AutomatedTellerMachine / withdrawCash | 5 | 0 |
| 9 | CoCoME / changePrice | 1 | 0 |
| 10 | CoCoME / closeCashDesk | 1 | 0 |
| 11 | CoCoME / closeStore | 1 | 0 |
| 12 | CoCoME / listSuppliers | 1 | 0 |
| 13 | CoCoME / manageCashDesk | 4 | 0 |
| 14 | CoCoME / manageCashier | 4 | 0 |
| 15 | CoCoME / manageProductCatalog | 4 | 0 |
| 16 | CoCoME / manageStore | 4 | 0 |
| 17 | CoCoME / manageSupplier | 4 | 0 |
| 18 | CoCoME / manageItem | 4 | 0 |
| 19 | CoCoME / openCashDesk | 1 | 0 |
| 20 | CoCoME / openStore | 1 | 0 |
| 21 | CoCoME / orderProducts | 5 | 2 |
| 22 | CoCoME / processSale | 4 | 2 |
| 23 | CoCoME / receiveOrderedProduct | 1 | 1 |
| 24 | CoCoME / showStockReports | 1 | 0 |
| 25 | LibraryManagementSystem / borrowBook | 1 | 0 |
| 26 | LibraryManagementSystem / cancelReservation | 1 | 0 |
| 27 | LibraryManagementSystem / countDownSuspensionDay | 1 | 1 |
| 28 | LibraryManagementSystem / listBookHistory | 5 | 2 |
| 29 | LibraryManagementSystem / listRecommendBook | 1 | 0 |
| 30 | LibraryManagementSystem / makeReservation | 1 | 0 |
| 31 | LibraryManagementSystem / manageBook | 1 | 0 |
| 32 | LibraryManagementSystem / manageBookCopy | 1 | 0 |
| 33 | LibraryManagementSystem / manageLibrarian | 1 | 0 |
| 34 | LibraryManagementSystem / manageSubject | 1 | 0 |
| 35 | LibraryManagementSystem / manageUser | 1 | 0 |
| 36 | LibraryManagementSystem / payOverDueFee | 1 | 0 |
| 37 | LibraryManagementSystem / recommendBook | 1 | 0 |
| 38 | LibraryManagementSystem / renewBook | 1 | 0 |
| 39 | LibraryManagementSystem / searchBook | 5 | 0 |
| 40 | LibraryManagementSystem / sendNotificationEmail | 1 | 0 |
| 41 | LoanProcessingSystem / closeOutLoan | 1 | 0 |
| 42 | LoanProcessingSystem / enterValidatedCreditReferences | 3 | 0 |
| 43 | LoanProcessingSystem / evaluateLoanRequest | 7 | 0 |
| 44 | LoanProcessingSystem / generateLoanLetterAndAgreement | 4 | 0 |
| 45 | LoanProcessingSystem / loanPayment | 1 | 0 |
| 46 | LoanProcessingSystem / manageLoanTerm | 4 | 0 |
| 47 | LoanProcessingSystem / submitLoanRequest | 2 | 0 |

## Complete Operation Inventory

| JSONL line | Original ID | Revision | Status | Difficulty | Reference |
|---:|---|---|---|---|---|
| 1 | Airport_manageDevice_createDevice | KEEP + NORMALIZE | VERIFIED | Hard | local verbatim |
| 2 | Airport_manageUser_createStaff | KEEP + NORMALIZE | VERIFIED | Hard | local verbatim |
| 3 | Airport_raiseRepair_approve | KEEP + NORMALIZE | VERIFIED | Hard | local verbatim |
| 4 | Airport_raiseRepair_finishRepair | KEEP + NORMALIZE | VERIFIED | Medium | local verbatim |
| 5 | Airport_raiseRepair_feedback | KEEP + NORMALIZE | VERIFIED | Hard | local verbatim |
| 6 | AutomatedTellerMachine_checkBalance_inputCard | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 7 | AutomatedTellerMachine_checkBalance_inputPassword | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 8 | AutomatedTellerMachine_checkBalance_checkBalance | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 9 | AutomatedTellerMachine_checkBalance_ejectCard | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 10 | AutomatedTellerMachine_depositFunds_inputCard | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 11 | AutomatedTellerMachine_depositFunds_inputPassword | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 12 | AutomatedTellerMachine_depositFunds_depositFunds | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 13 | AutomatedTellerMachine_depositFunds_printReceipt | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 14 | AutomatedTellerMachine_depositFunds_ejectCard | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 15 | AutomatedTellerMachine_manageBankCard_createBankCard | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 16 | AutomatedTellerMachine_manageBankCard_queryBankCard | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 17 | AutomatedTellerMachine_manageBankCard_modifyBankCard | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 18 | AutomatedTellerMachine_manageBankCard_deleteBankCard | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 19 | AutomatedTellerMachine_manageUser_createUser | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 20 | AutomatedTellerMachine_manageUser_queryUser | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 21 | AutomatedTellerMachine_manageUser_modifyUser | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 22 | AutomatedTellerMachine_manageUser_deleteUser | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 23 | AutomatedTellerMachine_withdrawCash_inputCard | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 24 | AutomatedTellerMachine_withdrawCash_inputPassword | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 25 | AutomatedTellerMachine_withdrawCash_withdrawCash | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 26 | AutomatedTellerMachine_withdrawCash_printReceipt | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 27 | AutomatedTellerMachine_withdrawCash_ejectCard | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 28 | CoCoME_changePrice_changePrice | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 29 | CoCoME_closeCashDesk_closeCashDesk | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 30 | CoCoME_closeStore_closeStore | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 31 | CoCoME_listSuppliers_listSuppliers | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 32 | CoCoME_manageCashDesk_createCashDesk | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 33 | CoCoME_manageCashDesk_queryCashDesk | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 34 | CoCoME_manageCashDesk_modifyCashDesk | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 35 | CoCoME_manageCashDesk_deleteCashDesk | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 36 | CoCoME_manageCashier_createCashier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 37 | CoCoME_manageCashier_queryCashier | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 38 | CoCoME_manageCashier_modifyCashier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 39 | CoCoME_manageCashier_deleteCashier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 40 | CoCoME_manageProductCatalog_createProductCatalog | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 41 | CoCoME_manageProductCatalog_queryProductCatalog | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 42 | CoCoME_manageProductCatalog_modifyProductCatalog | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 43 | CoCoME_manageProductCatalog_deleteProductCatalog | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 44 | CoCoME_manageStore_createStore | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 45 | CoCoME_manageStore_queryStore | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 46 | CoCoME_manageStore_modifyStore | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 47 | CoCoME_manageStore_deleteStore | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 48 | CoCoME_manageSupplier_createSupplier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 49 | CoCoME_manageSupplier_querySupplier | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 50 | CoCoME_manageSupplier_modifySupplier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 51 | CoCoME_manageSupplier_deleteSupplier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 52 | CoCoME_manageItem_createItem | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 53 | CoCoME_manageItem_queryItem | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 54 | CoCoME_manageItem_modifyItem | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 55 | CoCoME_manageItem_deleteItem | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 56 | CoCoME_openCashDesk_openCashDesk | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 57 | CoCoME_openStore_openStore | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 58 | CoCoME_orderProducts_makeNewOrder | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 59 | CoCoME_orderProducts_listAllOutOfStoreProducts | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 60 | CoCoME_orderProducts_orderItem | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 61 | CoCoME_orderProducts_chooseSupplier | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 62 | CoCoME_orderProducts_placeOrder | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 63 | CoCoME_processSale_makeNewSale | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 64 | CoCoME_processSale_enterItem | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 65 | CoCoME_processSale_endSale | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 66 | CoCoME_processSale_makeCashPayment | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 67 | CoCoME_receiveOrderedProduct_receiveOrderedProduct | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 68 | CoCoME_showStockReports_showStockReports | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 69 | LibraryManagementSystem_borrowBook_borrowBook | KEEP + NORMALIZE | VERIFIED | Hard | local verbatim |
| 70 | LibraryManagementSystem_cancelReservation_cancelReservation | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 71 | LibraryManagementSystem_countDownSuspensionDay_countDownSuspensionDay | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 72 | LibraryManagementSystem_listBookHistory_listBorrowHistory | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 73 | LibraryManagementSystem_listBookHistory_listHodingBook | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 74 | LibraryManagementSystem_listBookHistory_listOverDueBook | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 75 | LibraryManagementSystem_listBookHistory_listReservationBook | RECONSTRUCT FROM SOURCE | NEEDS_SOURCE | UNRESOLVED | candidate only |
| 76 | LibraryManagementSystem_listBookHistory_listRecommendBook | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 77 | LibraryManagementSystem_listRecommendBook_listRecommendBook | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 78 | LibraryManagementSystem_makeReservation_makeReservation | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 79 | LibraryManagementSystem_manageBook_createBook | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 80 | LibraryManagementSystem_manageBookCopy_addBookCopy | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 81 | LibraryManagementSystem_manageLibrarian_createLibrarian | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 82 | LibraryManagementSystem_manageSubject_createSubject | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 83 | LibraryManagementSystem_manageUser_createUser | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 84 | LibraryManagementSystem_payOverDueFee_payOverDueFee | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 85 | LibraryManagementSystem_recommendBook_recommendBook | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 86 | LibraryManagementSystem_renewBook_renewBook | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 87 | LibraryManagementSystem_searchBook_searchBookByBarCode | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 88 | LibraryManagementSystem_searchBook_searchBookByTitle | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 89 | LibraryManagementSystem_searchBook_searchBookByAuthor | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 90 | LibraryManagementSystem_searchBook_searchBookByISBN | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 91 | LibraryManagementSystem_searchBook_searchBookBySubject | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 92 | LibraryManagementSystem_sendNotificationEmail_sendNotificationEmail | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 93 | LoanProcessingSystem_closeOutLoan_closeOutLoan | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 94 | LoanProcessingSystem_enterValidatedCreditReferences_listSubmitedLoanRequest | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 95 | LoanProcessingSystem_enterValidatedCreditReferences_chooseLoanRequest | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 96 | LoanProcessingSystem_enterValidatedCreditReferences_markRequestValid | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 97 | LoanProcessingSystem_evaluateLoanRequest_listTenLoanRequest | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 98 | LoanProcessingSystem_evaluateLoanRequest_chooseOneForReview | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 99 | LoanProcessingSystem_evaluateLoanRequest_checkCreditHistory | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 100 | LoanProcessingSystem_evaluateLoanRequest_reviewCheckingAccount | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 101 | LoanProcessingSystem_evaluateLoanRequest_listAvaiableLoanTerm | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 102 | LoanProcessingSystem_evaluateLoanRequest_addLoanTerm | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 103 | LoanProcessingSystem_evaluateLoanRequest_approveLoanRequest | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 104 | LoanProcessingSystem_generateLoanLetterAndAgreement_listApprovalRequest | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 105 | LoanProcessingSystem_generateLoanLetterAndAgreement_genereateApprovalLetter | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 106 | LoanProcessingSystem_generateLoanLetterAndAgreement_generateLoanAgreement | RECONSTRUCT FROM SOURCE | VERIFIED | Hard | local verbatim |
| 107 | LoanProcessingSystem_generateLoanLetterAndAgreement_createLoanAccount | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 108 | LoanProcessingSystem_loanPayment_loanPayment | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 109 | LoanProcessingSystem_manageLoanTerm_createLoanTerm | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 110 | LoanProcessingSystem_manageLoanTerm_queryLoanTerm | RECONSTRUCT FROM SOURCE | VERIFIED | Easy | local verbatim |
| 111 | LoanProcessingSystem_manageLoanTerm_modifyLoanTerm | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 112 | LoanProcessingSystem_manageLoanTerm_deleteLoanTerm | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 113 | LoanProcessingSystem_submitLoanRequest_enterLoanInformation | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |
| 114 | LoanProcessingSystem_submitLoanRequest_calculateScore | RECONSTRUCT FROM SOURCE | VERIFIED | Medium | local verbatim |

## Verification and Reproduction

Read-only verification:

```powershell
python scripts/revise_operations_v2.py --verify
```

Regenerate this report after successful verification:

```powershell
python scripts/revise_operations_v2.py --verify --report
```

Regression tests for annotation machinery:

```powershell
python -m unittest scripts.test_revise_operations_v2 -v
```

Verification replays every reviewed annotation against current source literals and checks exact equality of the produced records, including source/test hashes, reference copies, scenario mappings, IDs, immutable fields and audit order. It is not a second semantic judge. After any source change, annotations must be reviewed again rather than simply rerunning experiments.

- Starting scaffold SHA-256: `32984c7fed8d511ae78202c1fc077bf6c7f0fde7bab8d5b4d26606a31b0de0da`
- Revised JSONL SHA-256: `d93f72aafa800ad4873074b614cfefffd537caba531dab7b3eff0e17f1d60e37`
- Starting snapshot: data/operation_revision/operations_v2_scaffold.original.jsonl
- Reviewed annotations: data/operation_revision/annotations/
- Machine verification summary: data/operation_revision/verification_summary.json

## Before Publication

Resolve the listed NEEDS_SOURCE items with author clarification, a domain invariant or a corrected authoritative specification; obtain independent human fidelity sign-off for the intended release subset; freeze the source-aligned V2 oracle version and a generation-only input view without reference/evidence fields; then rerun and separately label V2 experiments. Existing results must not be presented as results on these revised requirements.
