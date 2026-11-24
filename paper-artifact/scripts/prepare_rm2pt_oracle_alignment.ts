import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {isDeepStrictEqual} from 'node:util';
import {formatStructuredRequirement, getBenchmarkRequirement} from '../src/rm2pt/benchmarkRequirements';

const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
export function prepareRm2ptOracleAlignment(refresh = false) {
  const base = 'data/benchmark/rm2pt_authoritative_114';
  const target = `${base}/oracles/manifest.json`;
  if (fs.existsSync(target) && !refresh) throw new Error('Prepared oracle manifest exists; preserve it and review before updating');
  const input = `${base}/operations.jsonl`;
  const bytes = fs.readFileSync(input);
  const manifest = JSON.parse(fs.readFileSync(`${base}/manifest.json`, 'utf8'));
  const rows = bytes.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map(row => row.id)).size !== 114 || hash(bytes) !== manifest.output_sha256)
    throw new Error('Prepared source input failed integrity checks');
  type Spec = {id:string;project:string;useCase:string;operation:string;service:string;
    file:string;lines:number[];shared:string;copiedFrom?:string};
  const catalog:Spec[] = [
    ...['chooseLoanRequest','markRequestValid'].map((operation,i)=>({id:'LoanProcessingSystem_enterValidatedCreditReferences_'+operation,
      project:'LoanProcessingSystem',useCase:'enterValidatedCreditReferences',operation,service:'EnterValidatedCreditReferencesModule',
      file:operation+'.oracle.ts',lines:i?[436,454]:[408,433],shared:'EnterValidatedCreditReferencesModule::'+operation})),
    {id:'LoanProcessingSystem_evaluateLoanRequest_chooseOneForReview',project:'LoanProcessingSystem',
      useCase:'evaluateLoanRequest',operation:'chooseOneForReview',service:'EvaluateLoanRequestModule',
      file:'chooseOneForReview.oracle.ts',lines:[484,509],shared:'EvaluateLoanRequestModule::chooseOneForReview'},
    {id:'LoanProcessingSystem_evaluateLoanRequest_listTenLoanRequest',project:'LoanProcessingSystem',
      useCase:'evaluateLoanRequest',operation:'listTenLoanRequest',service:'EvaluateLoanRequestModule',
      file:'listTenLoanRequest.oracle.ts',lines:[456,481],shared:'EvaluateLoanRequestModule::listTenLoanRequest'},
    ...[{operation:'checkCreditHistory',lines:[512,529]},{operation:'reviewCheckingAccount',lines:[532,550]}]
      .map(spec=>({id:'LoanProcessingSystem_evaluateLoanRequest_'+spec.operation,project:'LoanProcessingSystem',
        useCase:'evaluateLoanRequest',operation:spec.operation,service:'EvaluateLoanRequestModule',
        file:spec.operation+'.oracle.ts',lines:spec.lines,shared:'EvaluateLoanRequestModule::'+spec.operation})),
    {id:'LoanProcessingSystem_evaluateLoanRequest_listAvaiableLoanTerm',project:'LoanProcessingSystem',
      useCase:'evaluateLoanRequest',operation:'listAvaiableLoanTerm',service:'EvaluateLoanRequestModule',
      file:'listAvaiableLoanTerm.oracle.ts',lines:[553,568],shared:'EvaluateLoanRequestModule::listAvaiableLoanTerm'},
    {id:'LoanProcessingSystem_evaluateLoanRequest_approveLoanRequest',project:'LoanProcessingSystem',
      useCase:'evaluateLoanRequest',operation:'approveLoanRequest',service:'EvaluateLoanRequestModule',
      file:'approveLoanRequest.oracle.ts',lines:[601,618],shared:'EvaluateLoanRequestModule::approveLoanRequest'},
    {id:'LoanProcessingSystem_generateLoanLetterAndAgreement_listApprovalRequest',project:'LoanProcessingSystem',
      useCase:'generateLoanLetterAndAgreement',operation:'listApprovalRequest',service:'GenerateLoanLetterAndAgreementModule',
      file:'listApprovalRequest.oracle.ts',lines:[621,646],shared:'GenerateLoanLetterAndAgreementModule::listApprovalRequest'},
    ...[{operation:'genereateApprovalLetter',lines:[649,684]},
      {operation:'generateLoanAgreement',lines:[708,733]}].map(spec=>({
      id:'LoanProcessingSystem_generateLoanLetterAndAgreement_'+spec.operation,project:'LoanProcessingSystem',
      useCase:'generateLoanLetterAndAgreement',operation:spec.operation,service:'GenerateLoanLetterAndAgreementModule',
      file:spec.operation+'.oracle.ts',lines:spec.lines,shared:'GenerateLoanLetterAndAgreementModule::'+spec.operation})),
    ...[{operation:'enterLoanInformation',lines:[236,293]},
      {operation:'calculateScore',lines:[352,376]}].map(spec=>({
      id:'LoanProcessingSystem_submitLoanRequest_'+spec.operation,project:'LoanProcessingSystem',
      useCase:'submitLoanRequest',operation:spec.operation,service:'SubmitLoanRequestModule',
      file:spec.operation+'.oracle.ts',lines:spec.lines,shared:'SubmitLoanRequestModule::'+spec.operation})),
    {id:'LibraryManagementSystem_renewBook_renewBook',project:'LibraryManagementSystem',useCase:'renewBook',operation:'renewBook',
      service:'LibraryManagementSystemSystem',file:'renewBook.oracle.ts',lines:[564,657],shared:'LibraryManagementSystemSystem::renewBook'},
    {id:'LibraryManagementSystem_recommendBook_recommendBook',project:'LibraryManagementSystem',useCase:'recommendBook',operation:'recommendBook',
      service:'LibraryManagementSystemSystem',file:'recommendBook.oracle.ts',lines:[996,1050],shared:'LibraryManagementSystemSystem::recommendBook'},
    {id:'LibraryManagementSystem_payOverDueFee_payOverDueFee',project:'LibraryManagementSystem',useCase:'payOverDueFee',operation:'payOverDueFee',
      service:'LibraryManagementSystemSystem',file:'payOverDueFee.oracle.ts',lines:[659,699],shared:'LibraryManagementSystemSystem::payOverDueFee'},
    {id:'LibraryManagementSystem_manageBookCopy_addBookCopy', project:'LibraryManagementSystem', useCase:'manageBookCopy', operation:'addBookCopy',
      service:'ManageBookCopyCRUDService', file:'addBookCopy.oracle.ts', lines:[1707,1755], shared:'ManageBookCopyCRUDService::addBookCopy'},
    {id: 'LibraryManagementSystem_makeReservation_makeReservation', project: 'LibraryManagementSystem', useCase: 'makeReservation',
      operation: 'makeReservation', service: 'LibraryManagementSystemSystem', file: 'makeReservation.oracle.ts',
      lines: [270, 323], shared: 'LibraryManagementSystemSystem::makeReservation'},
    {id: 'LibraryManagementSystem_cancelReservation_cancelReservation', project: 'LibraryManagementSystem', useCase: 'cancelReservation',
      operation: 'cancelReservation', service: 'LibraryManagementSystemSystem', file: 'cancelReservation.oracle.ts',
      lines: [325, 370], shared: 'LibraryManagementSystemSystem::cancelReservation'},
    {id: 'LibraryManagementSystem_sendNotificationEmail_sendNotificationEmail', project: 'LibraryManagementSystem',
      useCase: 'sendNotificationEmail', operation: 'sendNotificationEmail', service: 'ThirdPartyServices',
      file: 'sendNotificationEmail.oracle.ts', lines: [1271, 1287], shared: 'ThirdPartyServices::sendNotificationEmail'},
    {id: 'LibraryManagementSystem_listBookHistory_listBorrowHistory', project: 'LibraryManagementSystem',
      useCase: 'listBookHistory', operation: 'listBorrowHistory', service: 'ListBookHistory',
      file: 'listBorrowHistory.oracle.ts', lines: [852, 877], shared: 'ListBookHistory::listBorrowHistory'},
    {id: 'LibraryManagementSystem_listBookHistory_listHodingBook', project: 'LibraryManagementSystem',
      useCase: 'listBookHistory', operation: 'listHodingBook', service: 'ListBookHistory',
      file: 'listHodingBook.oracle.ts', lines: [879, 903], shared: 'ListBookHistory::listHodingBook'},
    ...[
      {operation: 'searchBookByBarCode', lines: [177, 194]},
      {operation: 'searchBookByTitle', lines: [196, 212]},
      {operation: 'searchBookByAuthor', lines: [214, 230]},
      {operation: 'searchBookByISBN', lines: [232, 248]},
      {operation: 'searchBookBySubject', lines: [250, 267]},
    ].map(spec => ({id: `LibraryManagementSystem_searchBook_${spec.operation}`, project: 'LibraryManagementSystem',
      useCase: 'searchBook', operation: spec.operation, service: 'SearchBook', file: `${spec.operation}.oracle.ts`,
      lines: spec.lines, shared: `SearchBook::${spec.operation}`})),
    {id: 'CoCoME_orderProducts_makeNewOrder', project: 'CoCoME', useCase: 'orderProducts', operation: 'makeNewOrder',
      service: 'CoCoMEOrderProducts', file: 'makeNewOrder.oracle.ts', lines: [609, 649], shared: 'CoCoMEOrderProducts::makeNewOrder'},
    {id: 'CoCoME_processSale_makeNewSale', project: 'CoCoME', useCase: 'processSale', operation: 'makeNewSale',
      service: 'ProcessSaleService', file: 'makeNewSale.oracle.ts', lines: [368, 408], shared: 'ProcessSaleService::makeNewSale'},
    {id: 'CoCoME_changePrice_changePrice', project: 'CoCoME', useCase: 'changePrice', operation: 'changePrice',
      service: 'CoCoMESystem', file: 'changePrice.oracle.ts', lines: [767, 793], shared: 'CoCoMESystem::changePrice'},
    {id: 'CoCoME_listSuppliers_listSuppliers', project: 'CoCoME', useCase: 'listSuppliers', operation: 'listSuppliers',
      service: 'CoCoMESystem', file: 'listSuppliers.oracle.ts', lines: [828, 844], shared: 'CoCoMESystem::listSuppliers'},
    {id: 'CoCoME_showStockReports_showStockReports', project: 'CoCoME', useCase: 'showStockReports', operation: 'showStockReports',
      service: 'CoCoMESystem', file: 'showStockReports.oracle.ts', lines: [846, 862], shared: 'CoCoMESystem::showStockReports'},
    {id: 'CoCoME_orderProducts_listAllOutOfStoreProducts', project: 'CoCoME', useCase: 'orderProducts', operation: 'listAllOutOfStoreProducts',
      service: 'CoCoMEOrderProducts', file: 'listAllOutOfStoreProducts.oracle.ts', lines: [652, 669], shared: 'CoCoMEOrderProducts::listAllOutOfStoreProducts'},
    {id: 'CoCoME_orderProducts_chooseSupplier', project: 'CoCoME', useCase: 'orderProducts', operation: 'chooseSupplier',
      service: 'CoCoMEOrderProducts', file: 'chooseSupplier.oracle.ts', lines: [712, 740], shared: 'CoCoMEOrderProducts::chooseSupplier'},
    ...['depositFunds', 'withdrawCash'].flatMap(useCase => [
      {id: `AutomatedTellerMachine_${useCase}_printReceipt`, project: 'AutomatedTellerMachine', useCase,
        operation: 'printReceipt', service: 'AutomatedTellerMachineSystem', file: 'printReceipt.oracle.ts',
        lines: [307, 344], shared: 'AutomatedTellerMachineSystem::printReceipt'},
      {id: `AutomatedTellerMachine_${useCase}_ejectCard`, project: 'AutomatedTellerMachine', useCase,
        operation: 'ejectCard', service: 'AutomatedTellerMachineSystem', file: 'ejectCard.oracle.ts',
        lines: [369, 402], shared: 'AutomatedTellerMachineSystem::ejectCard'},
    ]),
    {id: 'AutomatedTellerMachine_withdrawCash_withdrawCash', project: 'AutomatedTellerMachine', useCase: 'withdrawCash',
      operation: 'withdrawCash', service: 'AutomatedTellerMachineSystem', file: 'withdrawCash.oracle.ts',
      lines: [405, 432], shared: 'AutomatedTellerMachineSystem::withdrawCash'},
    ...['checkBalance', 'depositFunds', 'withdrawCash'].map(useCase => ({id: `AutomatedTellerMachine_${useCase}_inputPassword`,
      project: 'AutomatedTellerMachine', useCase, operation: 'inputPassword', service: 'AutomatedTellerMachineSystem',
      file: 'inputPassword.oracle.ts', lines: [274, 304], shared: 'AutomatedTellerMachineSystem::inputPassword'})),
    {id: 'AutomatedTellerMachine_checkBalance_checkBalance', project: 'AutomatedTellerMachine', useCase: 'checkBalance',
      operation: 'checkBalance', service: 'AutomatedTellerMachineSystem', file: 'checkBalance.oracle.ts',
      lines: [347, 366], shared: 'AutomatedTellerMachineSystem::checkBalance'},
    {id: 'AutomatedTellerMachine_depositFunds_depositFunds', project: 'AutomatedTellerMachine', useCase: 'depositFunds',
      operation: 'depositFunds', service: 'AutomatedTellerMachineSystem', file: 'depositFunds.oracle.ts',
      lines: [435, 462], shared: 'AutomatedTellerMachineSystem::depositFunds'},
    ...[
      {operation: 'openStore', lines: [234, 264]},
      {operation: 'closeStore', lines: [266, 294]},
      {operation: 'openCashDesk', lines: [296, 330]},
      {operation: 'closeCashDesk', lines: [332, 366]},
      {operation: 'closeOutLoan', lines: [952, 978]},
    ].map(spec => {
      const project = spec.operation === 'closeOutLoan' ? 'LoanProcessingSystem' : 'CoCoME';
      const service = spec.operation === 'closeOutLoan' ? 'LoanProcessingSystemSystem' : 'CoCoMESystem';
      return {id: `${project}_${spec.operation}_${spec.operation}`, project, useCase: spec.operation,
        operation: spec.operation, service, file: `${spec.operation}.oracle.ts`, lines: spec.lines,
        shared: `${service}::${spec.operation}`};
    }),
    ...[
      {operation: 'queryStore', entity: 'Store', useCase: 'manageStore', lines: [906, 930]},
      {operation: 'queryProductCatalog', entity: 'ProductCatalog', useCase: 'manageProductCatalog', lines: [1036, 1060]},
      {operation: 'queryCashDesk', entity: 'CashDesk', useCase: 'manageCashDesk', lines: [1164, 1188]},
      {operation: 'queryCashier', entity: 'Cashier', useCase: 'manageCashier', lines: [1292, 1316]},
      {operation: 'querySupplier', entity: 'Supplier', useCase: 'manageSupplier', lines: [1556, 1580]},
    ].map(spec => ({id: `CoCoME_${spec.useCase}_${spec.operation}`, project: 'CoCoME',
      useCase: spec.useCase, operation: spec.operation, service: `Manage${spec.entity}CRUDService`,
      file: `${spec.operation}.oracle.ts`, lines: spec.lines,
      shared: `Manage${spec.entity}CRUDService::${spec.operation}`})),
    {id: 'LibraryManagementSystem_countDownSuspensionDay_countDownSuspensionDay', project: 'LibraryManagementSystem',
      useCase: 'countDownSuspensionDay', operation: 'countDownSuspensionDay', service: 'LibraryManagementSystemSystem',
      file: 'countDownSuspensionDay.oracle.ts', lines: [810, 849], shared: 'LibraryManagementSystemSystem::countDownSuspensionDay'},
    {id: 'LibraryManagementSystem_listBookHistory_listOverDueBook', project: 'LibraryManagementSystem',
      useCase: 'listBookHistory', operation: 'listOverDueBook', service: 'ListBookHistory',
      file: 'listOverDueBook.oracle.ts', lines: [905, 934], shared: 'ListBookHistory::listOverDueBook'},
    {id: 'LibraryManagementSystem_listBookHistory_listReservationBook', project: 'LibraryManagementSystem',
      useCase: 'listBookHistory', operation: 'listReservationBook', service: 'ListBookHistory',
      file: 'listReservationBook.oracle.ts', lines: [936, 963], shared: 'ListBookHistory::listReservationBook'},
    ...['checkBalance', 'depositFunds', 'withdrawCash'].map(useCase => ({id: `AutomatedTellerMachine_${useCase}_inputCard`,
      project: 'AutomatedTellerMachine', useCase, operation: 'inputCard', service: 'AutomatedTellerMachineSystem',
      file: 'inputCard.oracle.ts', lines: [233, 271], shared: 'AutomatedTellerMachineSystem::inputCard'})),
    {id: 'Airport_manageDevice_createDevice', project: 'Airport', useCase: 'manageDevice', operation: 'createDevice',
      service: 'AirportSystem', file: 'createDevice.oracle.ts', lines: [190, 209], shared: 'AirportSystem::createDevice'},
    {id: 'LoanProcessingSystem_generateLoanLetterAndAgreement_createLoanAccount', project: 'LoanProcessingSystem',
      useCase: 'generateLoanLetterAndAgreement', operation: 'createLoanAccount', service: 'GenerateLoanLetterAndAgreementModule',
      file: 'createLoanAccount.oracle.ts', lines: [756, 778], shared: 'lab-restored-draft:GenerateLoanLetterAndAgreementModule::createLoanAccount'},
    {id: 'LibraryManagementSystem_listBookHistory_listRecommendBook', project: 'LibraryManagementSystem', useCase: 'listBookHistory',
      operation: 'listRecommendBook', service: 'ListBookHistory', file: 'recommendationHistory.oracle.ts', lines: [965, 993], shared: 'ListBookHistory::listRecommendBook'},
    {id: 'LibraryManagementSystem_listRecommendBook_listRecommendBook', project: 'LibraryManagementSystem', useCase: 'listRecommendBook',
      operation: 'listRecommendBook', service: 'LibraryManagementSystemSystem', file: 'recommendationStandalone.oracle.ts', lines: [965, 993], shared: 'ListBookHistory::listRecommendBook'},
    {id: 'CoCoME_orderProducts_placeOrder', project: 'CoCoME', useCase: 'orderProducts', operation: 'placeOrder',
      service: 'CoCoMEOrderProducts', file: 'placeOrder.oracle.ts', lines: [742, 765], shared: 'CoCoMEOrderProducts::placeOrder'},
    {id: 'CoCoME_processSale_endSale', project: 'CoCoME', useCase: 'processSale', operation: 'endSale',
      service: 'ProcessSaleService', file: 'endSale.oracle.ts', lines: [466, 495], shared: 'ProcessSaleService::endSale'},
    {id: 'CoCoME_receiveOrderedProduct_receiveOrderedProduct', project: 'CoCoME', useCase: 'receiveOrderedProduct', operation: 'receiveOrderedProduct',
      service: 'CoCoMESystem', file: 'receiveOrderedProduct.oracle.ts', lines: [803, 826], shared: 'CoCoMESystem::receiveOrderedProduct'},
  ];
  for(const row of rows.filter(item=>!catalog.some(spec=>spec.id===item.id))){
    const file=row.id+'.oracle.ts';
    if(!fs.existsSync(base+'/oracles/'+file))continue;
    const authority=row.rm2pt_authority;
    const sourceLines=fs.readFileSync(authority.source_path,'utf8').split(/\r?\n/);
    const start=sourceLines.findIndex(line=>/Contract\s+/.test(line)&&
      line.includes(authority.source_service+'::'+authority.source_operation+'('));
    const end=sourceLines.findIndex((line,index)=>index>start&&line.trim()==='}');
    if(!authority.original_active_contract||start<0||end<start)
      throw new Error('Staged Oracle lacks active source contract: '+row.id);
    const copiedFrom='test/'+row.project+'-'+row.service+'-'+row.operation_name+'/index.test.ts';
    const staged=fs.readFileSync(base+'/oracles/'+file);
    if(!staged.equals(fs.readFileSync(copiedFrom)))
      throw new Error('Staged Oracle differs from replayed historical test: '+row.id);
    catalog.push({id:row.id,project:row.project,useCase:row.useCase,operation:row.operation_name,
      service:row.service,file,lines:[start+1,end+1],
      shared:authority.source_service+'::'+authority.source_operation,copiedFrom});
  }
  const records = catalog.map(spec => {
    const {id} = spec;
    const source = `${base}/oracles/${spec.file}`;
    const row = rows.find(item => item.id === id);
    if (!row || row.project !== spec.project || row.useCase !== spec.useCase || row.operation_name !== spec.operation ||
        row.description !== formatStructuredRequirement(getBenchmarkRequirement(spec.project, spec.useCase, spec.operation)) ||
        row.service !== spec.service) throw new Error(`Oracle/input alignment mismatch: ${id}`);
    if (row.rm2pt_authority.decision_file && hash(fs.readFileSync(row.rm2pt_authority.decision_file)) !== row.rm2pt_authority.decision_sha256)
      throw new Error(`Oracle decision integrity mismatch: ${id}`);
    return {id, historical_jest: source, boundary_jest: null, jest_sha256: hash(fs.readFileSync(source)),
      requirement_hash: row.requirement_hash, context_hash: row.context_hash,
      source_path: row.rm2pt_authority.source_path, source_sha256: row.rm2pt_authority.source_sha256,
      source_lines: spec.lines, shared_source: spec.shared,
      review_status: 'pending-user-review', independent_expert_review: false,
      status: spec.copiedFrom ? 'STAGED_HISTORICAL_REPLAY_REQUIRES_FIDELITY_REVIEW'
        : 'PREPARED_REQUIRES_FUNCTIONAL_REPLAY',
      ...(spec.copiedFrom ? {reused_historical_jest:spec.copiedFrom} : {}),
      ...(spec.operation !== 'inputCard' ? {source_kind: row.rm2pt_authority.source_resolution,
        original_active_contract: row.rm2pt_authority.original_active_contract,
        decision_file: row.rm2pt_authority.decision_file, decision_sha256: row.rm2pt_authority.decision_sha256} : {}),
      ...(['placeOrder', 'endSale', 'receiveOrderedProduct'].includes(spec.operation)
        ? {executable_equivalent_contract_status: 'PENDING_DIALECT_EQUIVALENT_REPLAY_NOT_GROUND_TRUTH'} : {})};
  });
  const result = {version: 'rm2pt-authoritative-oracle-preparation-v1', role: 'preparation-only-not-formal-suite',
    input, input_sha256: hash(bytes), operation_count: 114, prepared_operation_count: records.length,
    pending_operation_count: rows.length - records.length, formal_experiment_ready: false,
    default_profile_changed: false, original_oracle_modified: false, records,
    pending_operation_ids: rows.filter(row => !records.some(item => item.id === row.id)).map(row => row.id)};
  if (fs.existsSync(target)) {
    const previousBytes = fs.readFileSync(target);
    const previous = JSON.parse(previousBytes.toString('utf8'));
    if (previous.role !== result.role || previous.version !== result.version || previous.formal_experiment_ready !== false ||
        previous.input_sha256 !== result.input_sha256 || !Array.isArray(previous.records) ||
        previous.records.some((record: {id: string}) => !isDeepStrictEqual(record, records.find(item => item.id === record.id))))
      throw new Error('Preserve previous prepared oracles/review edits; input drift or a manual merge requires separate review');
    const previousIds = new Set(previous.records.map((record: {id: string}) => record.id));
    const expectedPrevious = {...result, prepared_operation_count: previous.records.length,
      pending_operation_count: rows.length - previous.records.length, records: previous.records,
      pending_operation_ids: rows.filter(row => !previousIds.has(row.id)).map(row => row.id)};
    if (!isDeepStrictEqual(previous, expectedPrevious))
      throw new Error('Preserve previous oracle manifest annotations; manual merge is required');
    if (isDeepStrictEqual(previous, result)) throw new Error('Prepared oracle catalog is unchanged');
    const snapshot = `results/rm2pt-authority-alignment/oracle-before-${hash(previousBytes).slice(0, 16)}`;
    if (fs.existsSync(snapshot)) throw new Error('Prepared oracle snapshot exists; inspect an interrupted refresh');
    fs.mkdirSync(snapshot, {recursive: true});
    fs.copyFileSync(target, path.join(snapshot, 'manifest.json'));
  }
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (require.main === module) {
  const {values} = parseArgs({options: {refresh: {type: 'boolean', default: false}}});
  const result = prepareRm2ptOracleAlignment(values.refresh);
  console.log(JSON.stringify({prepared: result.prepared_operation_count, pending: result.pending_operation_count, formalReady: false}));
}
