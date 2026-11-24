import type {DevelopmentObligation, DevelopmentSource} from './types';

export type CocomeItemOperation = 'queryItem' | 'deleteItem';
export const COCOME_ITEM_CLOCK = '2026-01-15T12:00:00+08:00';
export const cocomeItemSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'OP37/queryItem and OP39/deleteItem. RM2Doc and the originating model are not independent sources.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'queryItem at lines 1424-1448; deleteItem at lines 1488-1516. No cascade or general frame requirement is inferred.',
  },
];
const obligation = (
  id: string,
  clause: DevelopmentObligation['clause'],
  requirement: string,
  documentLine: number,
  modelLines: [number, number],
  modelFeatures: string[]
): DevelopmentObligation => ({id, clause, requirement, documentLine, modelLines, modelFeatures});

export const cocomeItemSpecifications = {
  queryItem: {
    id: 'CoCoME_manageItem_queryItem',
    schemaVersion: 'development-behavior-cocome-queryItem-v1',
    obligations: [
      obligation(
        'P01',
        'precondition',
        'The supplied barcode must identify an existing Item.',
        4293,
        [1439, 1439],
        ['Item.Barcode', '$parameter.barcode']
      ),
      obligation(
        'Q01',
        'postcondition',
        'Return the existing Item identified by the supplied barcode.',
        4297,
        [1446, 1446],
        ['Item', 'Item.Barcode', '$parameter.barcode', '$result']
      ),
    ],
  },
  deleteItem: {
    id: 'CoCoME_manageItem_deleteItem',
    schemaVersion: 'development-behavior-cocome-deleteItem-v1',
    obligations: [
      obligation(
        'P01',
        'precondition',
        'The supplied barcode must identify an Item present in the repository.',
        4435,
        [1504, 1505],
        ['Item.Barcode', '$parameter.barcode']
      ),
      obligation(
        'Q01',
        'postcondition',
        'Remove the referenced Item from the Item repository.',
        4439,
        [1513, 1513],
        ['Item', 'Item.Barcode', '$parameter.barcode']
      ),
      obligation(
        'Q02',
        'postcondition',
        'The successful deletion must return true.',
        4439,
        [1514, 1514],
        ['$result']
      ),
    ],
  },
} satisfies Record<
  CocomeItemOperation,
  {id: string; schemaVersion: string; obligations: DevelopmentObligation[]}
>;

export type CocomeItemScenario = {
  id: string;
  barcode: number;
  hasTarget: boolean;
  targetFirst: boolean;
  otherBarcodes: number[];
};
// Integer values vary without adding an unsupported positive-barcode restriction.
export const cocomeItemScenarios: CocomeItemScenario[] = [
  {
    id: 'dev-item-target-first',
    barcode: 971101,
    hasTarget: true,
    targetFirst: true,
    otherBarcodes: [971109],
  },
  {
    id: 'dev-item-target-last',
    barcode: 971202,
    hasTarget: true,
    targetFirst: false,
    otherBarcodes: [971201, 971199],
  },
  {
    id: 'dev-item-negative-barcode',
    barcode: -971301,
    hasTarget: true,
    targetFirst: true,
    otherBarcodes: [],
  },
  {
    id: 'dev-item-zero-barcode',
    barcode: 0,
    hasTarget: true,
    targetFirst: true,
    otherBarcodes: [971401],
  },
  {
    id: 'dev-item-missing-with-neighbors',
    barcode: 971502,
    hasTarget: false,
    targetFirst: true,
    otherBarcodes: [971501],
  },
  {
    id: 'dev-item-empty-repository',
    barcode: 971601,
    hasTarget: false,
    targetFirst: true,
    otherBarcodes: [],
  },
];
