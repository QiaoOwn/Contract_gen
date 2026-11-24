import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';

export const COCOME_STOCK_OPERATIONS = ['changePrice', 'listSuppliers', 'showStockReports', 'listAllOutOfStoreProducts', 'chooseSupplier'] as const;
export type CocomeStockOperation = typeof COCOME_STOCK_OPERATIONS[number];
export const cocomeStockSources: DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'OP12, OP14, OP16, OP18, OP19 pre/post tables; same provenance as remodel, not independent requirements.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Active contracts 652-669, 712-740, 767-793, 828-844, 846-862; no extra price, stock, order-status or repository guards.'},
];
const obligation = (id: string, requirement: string, documentLine: number, line: number, modelFeatures: string[]): DevelopmentObligation => ({
  id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement,
  documentLine, modelLines: [line, line], modelFeatures,
});
export const cocomeStockSpecifications = {
  changePrice: {id: 'CoCoME_changePrice_changePrice', useCase: 'changePrice', service: 'CoCoMESystem', entity: 'Item',
    lines: [767, 793], obligations: [
      obligation('P01', 'The Item identified by barcode exists.', 2820, 782, ['Item.Barcode', '$parameter.barcode']),
      obligation('Q01', 'The selected Item price becomes newPrice.', 2824, 790, ['Item.Price', '$parameter.newPrice']),
      obligation('Q02', 'The successful operation returns true.', 2824, 791, ['$result']),
    ]},
  listSuppliers: {id: 'CoCoME_listSuppliers_listSuppliers', useCase: 'listSuppliers', service: 'CoCoMESystem', entity: 'Supplier',
    lines: [828, 844], obligations: [
      obligation('P01', 'No additional business precondition is required.', 2957, 835, ['Supplier']),
      obligation('Q01', 'Return all registered Supplier objects by identity, including distinct objects with equal attribute values.', 2961, 842, ['Supplier', '$result']),
    ]},
  showStockReports: {id: 'CoCoME_showStockReports_showStockReports', useCase: 'showStockReports', service: 'CoCoMESystem', entity: 'Item',
    lines: [846, 862], obligations: [
      obligation('P01', 'No additional business precondition is required.', 3012, 853, ['Item']),
      obligation('Q01', 'Return all registered Item objects by identity, without an additional stock filter.', 3016, 860, ['Item', '$result']),
    ]},
  listAllOutOfStoreProducts: {id: 'CoCoME_orderProducts_listAllOutOfStoreProducts', useCase: 'orderProducts', service: 'CoCoMEOrderProducts', entity: 'Item',
    lines: [652, 669], obligations: [
      obligation('P01', 'No additional business precondition is required.', 2548, 659, ['Item']),
      obligation('Q01', 'Return exactly the registered Item objects whose stock quantity is zero, preserving object identity.', 2552, 667, ['Item.StockNumber', '$result']),
    ]},
  chooseSupplier: {id: 'CoCoME_orderProducts_chooseSupplier', useCase: 'orderProducts', service: 'CoCoMEOrderProducts', entity: 'Supplier',
    lines: [712, 740], obligations: [
      obligation('P01', 'The Supplier identified by supplierID exists.', 2688, 728, ['Supplier.Id', '$parameter.supplierID']),
      obligation('P02', 'A current OrderProduct exists.', 2688, 729, ['self.CurrentOrderProduct']),
      obligation('Q01', 'The current OrderProduct Supplier association refers to the selected Supplier object.', 2692, 737, ['self.CurrentOrderProduct', 'OrderProduct.Supplier', 'Supplier.Id', '$parameter.supplierID']),
      obligation('Q02', 'The successful operation returns true.', 2692, 738, ['$result']),
    ]},
} as const;
export type CocomeStockScenario = FiniteScenario & {
  values?: number[]; equalAttributes?: boolean; identifier?: number; price?: number;
  missingTarget?: boolean; emptyRepository?: boolean; missingOrder?: boolean; previousSupplier?: boolean;
};
export function cocomeStockScenarios(operation: CocomeStockOperation): CocomeStockScenario[] {
  const spec = cocomeStockSpecifications[operation], all = spec.obligations.map(item => item.id);
  const fact = (id: string, fields: Omit<CocomeStockScenario, 'id' | 'obligationIds'> & {obligationIds?: string[]}): CocomeStockScenario => ({id: `dev-${operation}-${id}`, obligationIds: all, ...fields});
  if (operation === 'changePrice') return [
    fact('nonfirst', {identifier: 813, price: 27.25}), fact('zero-price', {identifier: 414, price: 0}),
    fact('negative-price', {identifier: 522, price: -9.75}), fact('zero-barcode', {identifier: 0, price: 8.25}),
    fact('negative-barcode', {identifier: -17, price: 42.5}),
    fact('missing', {missingTarget: true, rejectObligation: 'P01', obligationIds: ['P01']}),
    fact('empty', {missingTarget: true, emptyRepository: true, rejectObligation: 'P01', obligationIds: ['P01']}),
  ];
  if (operation === 'chooseSupplier') return [
    fact('nonfirst', {identifier: 413}), fact('replace-link', {identifier: 923, previousSupplier: true}),
    fact('unregistered-order', {identifier: 731}), fact('zero-identifier', {identifier: 0}),
    fact('negative-identifier', {identifier: -23}),
    fact('missing-supplier', {missingTarget: true, rejectObligation: 'P01', obligationIds: ['P01']}),
    fact('empty', {missingTarget: true, emptyRepository: true, rejectObligation: 'P01', obligationIds: ['P01']}),
    fact('missing-order', {missingOrder: true, rejectObligation: 'P02', obligationIds: ['P02']}),
  ];
  if (operation === 'listAllOutOfStoreProducts') return [
    fact('empty', {values: []}), fact('one-zero', {values: [0]}),
    fact('mixed', {values: [0, 7, -2, 0]}), fact('no-zero', {values: [9, -5]}),
    fact('all-zero', {values: [0, 0, 0]}), fact('equal-attributes', {values: [0, 0], equalAttributes: true}),
    fact('middle-members', {values: [5, 0, 0, -4, 11]}),
  ];
  return [fact('empty', {values: []}), fact('one', {values: [17]}),
    fact('mixed', {values: [7, 0, -3]}), fact('negative', {values: [-22, -11]}),
    fact('zero', {values: [0]}), fact('equal-attributes', {values: [0, 0], equalAttributes: true})];
}
