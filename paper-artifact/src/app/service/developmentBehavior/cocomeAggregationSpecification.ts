import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';

export const COCOME_AGGREGATIONS = ['placeOrder', 'endSale', 'receiveOrderedProduct'] as const;
export type CocomeAggregation = typeof COCOME_AGGREGATIONS[number];
const sourceFiles: DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'Historical RM2Doc specification, not an independent source. Aggregation differences are resolved by the cited laboratory decision.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Unmodified original model. The original conflicting per-entry equalities and collection typing are not treated as equivalent to the approved semantics.'},
];
const obligation = (id: string, requirement: string, modelLines: [number, number], features: string[], decisionLine = 16): DevelopmentObligation => ({
  id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement,
  documentLine: id.startsWith('P') ? 14 : decisionLine, requirementSourceId: 'adjudication', modelLines, modelFeatures: features,
  evidenceNote: 'Business interpretation follows the user-approved R02/R03/R04 decision. Model lines retain historical provenance, not an executable equivalence certificate.',
});
export const cocomeAggregationSpecifications = {
  placeOrder: {id: 'CoCoME_orderProducts_placeOrder', useCase: 'orderProducts', service: 'CoCoMEOrderProducts',
    schemaVersion: 'development-cocome-placeOrder-adjudicated-v1',
    sources: [...sourceFiles, {id: 'adjudication', path: 'data/operation_revision/rm2pt_authority_decisions/R02_placeOrder.json',
      sha256: 'a7b82189f073ad724abb46f05dcb7480fc892ad988fc59ff586d576b13930cb0', note: 'Owner-approved R02, not independent expert review.'}],
    obligations: [
      obligation('P01', 'A current OrderProduct exists.', [749, 749], ['self.CurrentOrderProduct']),
      obligation('Q01', 'The current order status becomes REQUESTED.', [759, 759], ['self.CurrentOrderProduct', 'OrderProduct.OrderStatus']),
      obligation('Q02', 'Its amount becomes its operation-entry amount plus every associated entry subtotal; equal values on distinct entries count separately and an empty order preserves the entry amount.',
        [760, 761], ['self.CurrentOrderProduct', 'OrderProduct.Amount', 'OrderProduct.ContainedEntries', 'OrderEntry.SubAmount'], 17),
      obligation('Q03', 'Return true.', [763, 763], ['$result'], 20),
    ]},
  endSale: {id: 'CoCoME_processSale_endSale', useCase: 'processSale', service: 'ProcessSaleService',
    schemaVersion: 'development-cocome-endSale-adjudicated-v1',
    sources: [...sourceFiles, {id: 'adjudication', path: 'data/operation_revision/rm2pt_authority_decisions/R03_endSale.json',
      sha256: '61806438449f2fe00e814a31ffb8ac23bb94f1135996e3bb1f799188608407b7', note: 'Owner-approved R03, not independent expert review.'}],
    obligations: [
      obligation('P01', 'The current Sale exists.', [480, 480], ['self.CurrentSale']),
      obligation('P02', 'The current Sale is incomplete.', [481, 481], ['self.CurrentSale', 'Sale.IsComplete']),
      obligation('P03', 'The current Sale is not ready for payment.', [482, 482], ['self.CurrentSale', 'Sale.IsReadytoPay']),
      obligation('Q01', 'The current Sale becomes ready for payment.', [492, 492], ['self.CurrentSale', 'Sale.IsReadytoPay'], 19),
      obligation('Q02', 'Replace the Sale amount with the sum of every sales-line subtotal, counting equal values separately; use zero for empty sales lines.',
        [491, 491], ['self.CurrentSale', 'Sale.Amount', 'Sale.ContainedSalesLine', 'SalesLineItem.Subamount']),
      obligation('Q03', 'Return the resulting numeric Sale amount.', [493, 493], ['Sale.Amount', '$result'], 20),
    ]},
  receiveOrderedProduct: {id: 'CoCoME_receiveOrderedProduct_receiveOrderedProduct', useCase: 'receiveOrderedProduct', service: 'CoCoMESystem',
    schemaVersion: 'development-cocome-receiveOrderedProduct-adjudicated-v1',
    sources: [...sourceFiles, {id: 'adjudication', path: 'data/operation_revision/rm2pt_authority_decisions/R04_receiveOrderedProduct.json',
      sha256: '4bebf20704aec7de71871edc8ed8823ed0e69bef95c4a86cddda810012831100', note: 'Owner-approved R04, not independent expert review.'}],
    obligations: [
      obligation('P01', 'The referenced OrderProduct exists.', [810, 810], ['OrderProduct.Id', '$parameter.orderID']),
      obligation('Q01', 'The referenced order status becomes RECEIVED.', [820, 820], ['OrderProduct.OrderStatus', '$parameter.orderID']),
      obligation('Q02', 'For each Item identity, add all this order entry quantities referring to it to that Item operation-entry stock; count equal quantities separately and accumulate different Items independently.',
        [821, 822], ['OrderProduct.ContainedEntries', 'OrderEntry.Item', 'OrderEntry.Quantity', 'Item.StockNumber'], 17),
      obligation('Q03', 'Return true.', [824, 824], ['$result'], 20),
    ]},
} satisfies Record<CocomeAggregation, {id: string; useCase: string; service: string; schemaVersion: string;
  sources: DevelopmentSource[]; obligations: DevelopmentObligation[]}>;

export type AggregationScenario = FiniteScenario & {beforeAmount?: number; subtotals?: number[]; expectedAmount?: number;
  stocks?: number[]; entries?: {item: number; quantity: number}[]; expectedStocks?: number[];
  missing?: boolean; complete?: boolean; ready?: boolean};
const valid = (operation: CocomeAggregation, id: string, facts: Omit<AggregationScenario, 'id' | 'obligationIds'>): AggregationScenario =>
  ({id, obligationIds: cocomeAggregationSpecifications[operation].obligations.map(item => item.id), ...facts});
const reject = (id: string, obligation: string, facts: Omit<AggregationScenario, 'id' | 'obligationIds'>): AggregationScenario =>
  ({id, obligationIds: [obligation], rejectObligation: obligation, ...facts});
export const cocomeAggregationScenarios: Record<CocomeAggregation, AggregationScenario[]> = {
  placeOrder: [
    valid('placeOrder', 'dev-distinct-subtotals', {beforeAmount: 100, subtotals: [20, 30], expectedAmount: 150}),
    valid('placeOrder', 'dev-equal-subtotals-on-distinct-entries', {beforeAmount: 100, subtotals: [20, 20], expectedAmount: 140}),
    valid('placeOrder', 'dev-empty-order', {beforeAmount: 41.25, subtotals: [], expectedAmount: 41.25}),
    valid('placeOrder', 'dev-fractional-subtotals', {beforeAmount: 777, subtotals: [12.5, 7.25], expectedAmount: 796.75}),
    reject('dev-missing-current-order', 'P01', {missing: true}),
  ],
  endSale: [
    valid('endSale', 'dev-replace-not-increment', {beforeAmount: 777, subtotals: [20, 30], expectedAmount: 50}),
    valid('endSale', 'dev-equal-line-subtotals', {beforeAmount: 777, subtotals: [20, 20], expectedAmount: 40}),
    valid('endSale', 'dev-empty-sales-lines', {beforeAmount: 777, subtotals: [], expectedAmount: 0}),
    valid('endSale', 'dev-fractional-sales-lines', {beforeAmount: 777, subtotals: [12.5, 7.25], expectedAmount: 19.75}),
    reject('dev-missing-sale', 'P01', {missing: true}),
    reject('dev-completed-sale', 'P02', {complete: true}),
    reject('dev-already-ready-sale', 'P03', {ready: true}),
  ],
  receiveOrderedProduct: [
    valid('receiveOrderedProduct', 'dev-distinct-items', {stocks: [10, 40], entries: [{item: 0, quantity: 2}, {item: 1, quantity: 4}], expectedStocks: [12, 44]}),
    valid('receiveOrderedProduct', 'dev-shared-item-different-quantities', {stocks: [10], entries: [{item: 0, quantity: 2}, {item: 0, quantity: 3}], expectedStocks: [15]}),
    valid('receiveOrderedProduct', 'dev-shared-item-equal-quantities', {stocks: [10], entries: [{item: 0, quantity: 2}, {item: 0, quantity: 2}], expectedStocks: [14]}),
    valid('receiveOrderedProduct', 'dev-mixed-item-aliases', {stocks: [10, 40], entries: [{item: 0, quantity: 2}, {item: 1, quantity: 4}, {item: 0, quantity: 3}], expectedStocks: [15, 44]}),
    valid('receiveOrderedProduct', 'dev-empty-received-order', {stocks: [], entries: [], expectedStocks: []}),
    reject('dev-missing-received-order', 'P01', {missing: true}),
  ],
};
