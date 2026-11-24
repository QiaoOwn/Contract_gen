import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';
export const COCOME_CREATION_OPERATIONS = ['makeNewOrder', 'makeNewSale'] as const;
export type CocomeCreationOperation = typeof COCOME_CREATION_OPERATIONS[number];
export const cocomeCreationSources: DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'OP5 2010/2014, OP11 2479/2483. OP11 table says None, but the active model and current frozen input explicitly require an unused identifier.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Active 368-408 and 609-649 contracts. Check freshness and specified associations without imposing exact creation counts, positive IDs or unstated defaults.'},
];
const obligation = (id: string, requirement: string, doc: number, line: number, modelFeatures: string[]): DevelopmentObligation => ({
  id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement, documentLine: doc,
  modelLines: [line, line], modelFeatures,
});
export const cocomeCreationSpecifications = {
  makeNewOrder: {id: 'CoCoME_orderProducts_makeNewOrder', useCase: 'orderProducts', service: 'CoCoMEOrderProducts', entity: 'OrderProduct',
    lines: [609, 649], obligations: [
      {...obligation('P01', 'No OrderProduct has the supplied orderid.', 626, 626, ['OrderProduct.Id', '$parameter.orderid']),
        requirementSourceId: 'upstream-model', evidenceNote: 'Active model guard and current frozen input agree; the generated requirement table incorrectly says None.'},
      obligation('Q01', 'A fresh OrderProduct object is created.', 2483, 641, ['OrderProduct']),
      obligation('Q02', 'The new order status is NEW.', 2483, 642, ['OrderProduct.OrderStatus']),
      obligation('Q03', 'The new order identifier equals orderid.', 2483, 643, ['OrderProduct.Id', '$parameter.orderid']),
      {...obligation('Q04', 'The new order time is the current operation time.', 2483, 644, ['OrderProduct.Time']),
        evidenceNote: 'Now is an invocation environment value, not a UML element; its requirement is cited here and its value is checked against the observation clock.'},
      obligation('Q05', 'The new order is stored in the OrderProduct repository.', 2483, 645, ['OrderProduct']),
      obligation('Q06', 'CurrentOrderProduct refers to the new order.', 2483, 646, ['self.CurrentOrderProduct', 'OrderProduct']),
      obligation('Q07', 'The successful operation returns true.', 2483, 647, ['$result']),
    ]},
  makeNewSale: {id: 'CoCoME_processSale_makeNewSale', useCase: 'processSale', service: 'ProcessSaleService', entity: 'Sale',
    lines: [368, 408], obligations: [
      obligation('P01', 'A current CashDesk exists.', 2010, 377, ['self.CurrentCashDesk']),
      obligation('P02', 'The current CashDesk is open.', 2010, 378, ['self.CurrentCashDesk', 'CashDesk.IsOpened']),
      obligation('P03', 'There is no current Sale, or the current Sale is complete.', 2010, 379, ['self.CurrentSale', 'Sale.IsComplete']),
      obligation('Q01', 'A fresh Sale object is created.', 2014, 399, ['Sale']),
      obligation('Q02', 'The new Sale belongs to the current CashDesk.', 2014, 400, ['Sale.BelongedCashDesk', 'self.CurrentCashDesk']),
      obligation('Q03', 'The current CashDesk ContainedSales includes the new Sale.', 2014, 401, ['CashDesk.ContainedSales', 'self.CurrentCashDesk', 'Sale']),
      obligation('Q04', 'The new Sale is incomplete.', 2014, 402, ['Sale.IsComplete']),
      obligation('Q05', 'The new Sale is not ready for payment.', 2014, 403, ['Sale.IsReadytoPay']),
      obligation('Q06', 'The new Sale is stored in the Sale repository.', 2014, 404, ['Sale']),
      obligation('Q07', 'CurrentSale refers to the new Sale.', 2014, 405, ['self.CurrentSale', 'Sale']),
      obligation('Q08', 'The successful operation returns true.', 2014, 406, ['$result']),
    ]},
} as const;
export type CocomeCreationScenario = FiniteScenario & {identifier?: number; previous?: boolean; neighbors?: boolean;
  oldReady?: boolean; duplicate?: boolean; missingDesk?: boolean; closedDesk?: boolean; incompleteSale?: boolean};
export function cocomeCreationScenarios(operation: CocomeCreationOperation): CocomeCreationScenario[] {
  const all = cocomeCreationSpecifications[operation].obligations.map(item => item.id);
  const fact = (id: string, value: Omit<CocomeCreationScenario, 'id' | 'obligationIds'> & {obligationIds?: string[]}): CocomeCreationScenario =>
    ({id: `dev-${operation}-${id}`, obligationIds: all, ...value});
  return operation === 'makeNewOrder' ? [
    fact('unused', {identifier: 827}), fact('zero-id', {identifier: 0}), fact('negative-id', {identifier: -35}),
    fact('replace-current', {identifier: 611, previous: true}), fact('with-neighbors', {identifier: 941, neighbors: true}),
    fact('duplicate', {identifier: 827, duplicate: true, rejectObligation: 'P01', obligationIds: ['P01']}),
  ] : [
    fact('no-current-sale', {}), fact('previous-complete', {previous: true}),
    fact('unregistered-desk', {neighbors: true}), fact('existing-sale-members', {previous: true, neighbors: true}),
    fact('old-sale-ready', {previous: true, oldReady: true}),
    fact('no-desk', {missingDesk: true, rejectObligation: 'P01', obligationIds: ['P01']}),
    fact('closed-desk', {closedDesk: true, rejectObligation: 'P02', obligationIds: ['P02']}),
    fact('incomplete-sale', {incompleteSale: true, rejectObligation: 'P03', obligationIds: ['P03']}),
  ];
}
