import type {DevelopmentObligation, DevelopmentSource} from './types';

export const COCOME_DELETIONS_CLOCK = '2026-01-15T12:00:00+08:00';
export const cocomeDeletionsSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'Individually inspected OP23, OP27, OP31, OP35 and OP43. RM2Doc and the originating model share one source.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Only target existence, repository removal and true return are specified. No cascade, inverse association, rollback or general frame obligation is inferred.',
  },
];
export const cocomeDeletionOperations = [
  'deleteStore',
  'deleteProductCatalog',
  'deleteCashDesk',
  'deleteCashier',
  'deleteSupplier',
] as const;
export type CocomeDeletionOperation = (typeof cocomeDeletionOperations)[number];
type Specification = {
  id: string;
  entity: string;
  useCase:
    | 'manageStore'
    | 'manageProductCatalog'
    | 'manageCashDesk'
    | 'manageCashier'
    | 'manageSupplier';
  service: string;
  schemaVersion: string;
  obligations: DevelopmentObligation[];
};
const specification = (
  operation: CocomeDeletionOperation,
  entity: string,
  useCase: Specification['useCase'],
  documentDefinition: number,
  documentPrecondition: number,
  documentPostcondition: number,
  modelDefinition: number,
  modelPrecondition: number,
  modelRemoval: number,
  modelResult: number
): Specification => ({
  id: `CoCoME_${useCase}_${operation}`,
  entity,
  useCase,
  service: `Manage${entity}CRUDService`,
  schemaVersion: `development-behavior-cocome-${operation}-v1`,
  obligations: [
    {
      id: 'P01',
      clause: 'precondition',
      requirement: `The supplied identifier must identify a ${entity} present in the repository.`,
      documentLine: documentPrecondition,
      modelLines: [modelPrecondition, modelPrecondition + 1],
      modelFeatures: [`${entity}.Id`, '$parameter.id'],
      evidenceNote: `The target is selected by Id at document line ${documentDefinition} and model line ${modelDefinition}. Existence and repository membership are combined as in the current input; no positive-ID or uniqueness guard is added.`,
    },
    {
      id: 'Q01',
      clause: 'postcondition',
      requirement: `Remove the referenced ${entity} from the ${entity} repository.`,
      documentLine: documentPostcondition,
      modelLines: [modelRemoval, modelRemoval],
      modelFeatures: [entity, `${entity}.Id`, '$parameter.id'],
      localizationTargets: [entity],
      evidenceNote:
        'Capture the referenced object before execution and check its identity-based absence afterwards. Do not infer cascade deletion or unrelated-object preservation.',
    },
    {
      id: 'Q02',
      clause: 'postcondition',
      requirement: 'The successful deletion must return true.',
      documentLine: documentPostcondition,
      modelLines: [modelResult, modelResult],
      modelFeatures: ['$result'],
    },
  ],
});
// Each row is an audited source mapping, not a CRUD-based inference.
export const cocomeDeletionSpecifications: Record<CocomeDeletionOperation, Specification> = {
  deleteStore: specification(
    'deleteStore',
    'Store',
    'manageStore',
    3287,
    3291,
    3295,
    976,
    984,
    993,
    994
  ),
  deleteProductCatalog: specification(
    'deleteProductCatalog',
    'ProductCatalog',
    'manageProductCatalog',
    3569,
    3573,
    3577,
    1102,
    1110,
    1119,
    1120
  ),
  deleteCashDesk: specification(
    'deleteCashDesk',
    'CashDesk',
    'manageCashDesk',
    3855,
    3859,
    3863,
    1232,
    1240,
    1249,
    1250
  ),
  deleteCashier: specification(
    'deleteCashier',
    'Cashier',
    'manageCashier',
    4137,
    4141,
    4145,
    1358,
    1366,
    1375,
    1376
  ),
  deleteSupplier: specification(
    'deleteSupplier',
    'Supplier',
    'manageSupplier',
    4713,
    4717,
    4721,
    1622,
    1630,
    1639,
    1640
  ),
};
export const cocomeDeletionScenarios = [
  {
    id: 'dev-delete-target-first',
    identifier: 994101,
    hasTarget: true,
    targetFirst: true,
    neighbors: [994109],
  },
  {
    id: 'dev-delete-target-last',
    identifier: 994202,
    hasTarget: true,
    targetFirst: false,
    neighbors: [994201, 994199],
  },
  {
    id: 'dev-delete-negative-id',
    identifier: -994301,
    hasTarget: true,
    targetFirst: true,
    neighbors: [],
  },
  {
    id: 'dev-delete-zero-id',
    identifier: 0,
    hasTarget: true,
    targetFirst: false,
    neighbors: [994401],
  },
  {
    id: 'dev-delete-missing-with-neighbors',
    identifier: 994502,
    hasTarget: false,
    targetFirst: true,
    neighbors: [994501],
  },
  {
    id: 'dev-delete-empty-repository',
    identifier: 994601,
    hasTarget: false,
    targetFirst: true,
    neighbors: [],
  },
];
