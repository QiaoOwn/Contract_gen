import type {DevelopmentObligation, DevelopmentSource} from './types';

export const COCOME_QUERIES_CLOCK = '2026-01-15T12:00:00+08:00';
export const cocomeQueriesSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'Explicitly audited OP21, OP25, OP29, OP33 and OP41; this document and its originating model share one source.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Each operation has an identifier-based definition, an existence precondition and an object return. No general frame or identifier-domain restriction is inferred.',
  },
];
export const cocomeQueryOperations = [
  'queryStore',
  'queryProductCatalog',
  'queryCashDesk',
  'queryCashier',
  'querySupplier',
] as const;
export type CocomeQueryOperation = (typeof cocomeQueryOperations)[number];
type QuerySpecification = {
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
  operation: CocomeQueryOperation,
  entity: string,
  useCase: QuerySpecification['useCase'],
  documentDefinition: number,
  documentPrecondition: number,
  documentPostcondition: number,
  modelDefinition: number,
  modelPrecondition: number,
  modelPostcondition: number
): QuerySpecification => ({
  id: `CoCoME_${useCase}_${operation}`,
  entity,
  useCase,
  service: `Manage${entity}CRUDService`,
  schemaVersion: `development-behavior-cocome-${operation}-v1`,
  obligations: [
    {
      id: 'P01',
      clause: 'precondition',
      requirement: `The supplied identifier must identify an existing ${entity}.`,
      documentLine: documentPrecondition,
      modelLines: [modelPrecondition, modelPrecondition],
      modelFeatures: [`${entity}.Id`, '$parameter.id'],
      evidenceNote: `The referenced object is selected by Id in document line ${documentDefinition} and model line ${modelDefinition}. No positivity or uniqueness guard is added.`,
    },
    {
      id: 'Q01',
      clause: 'postcondition',
      requirement: `Return the existing ${entity} identified by the supplied identifier.`,
      documentLine: documentPostcondition,
      modelLines: [modelPostcondition, modelPostcondition],
      modelFeatures: [entity, `${entity}.Id`, '$parameter.id', '$result'],
      evidenceNote: `The returned object is the definition-bound object from document line ${documentDefinition} and model line ${modelDefinition}, not a newly constructed equal copy.`,
    },
  ],
});
// These mappings were inspected individually against the upstream document, model and frozen input.
export const cocomeQuerySpecifications: Record<CocomeQueryOperation, QuerySpecification> = {
  queryStore: specification('queryStore', 'Store', 'manageStore', 3147, 3151, 3155, 914, 921, 928),
  queryProductCatalog: specification(
    'queryProductCatalog',
    'ProductCatalog',
    'manageProductCatalog',
    3433,
    3437,
    3441,
    1044,
    1051,
    1058
  ),
  queryCashDesk: specification(
    'queryCashDesk',
    'CashDesk',
    'manageCashDesk',
    3717,
    3721,
    3725,
    1172,
    1179,
    1186
  ),
  queryCashier: specification(
    'queryCashier',
    'Cashier',
    'manageCashier',
    4001,
    4005,
    4009,
    1300,
    1307,
    1314
  ),
  querySupplier: specification(
    'querySupplier',
    'Supplier',
    'manageSupplier',
    4577,
    4581,
    4585,
    1564,
    1571,
    1578
  ),
};
export const cocomeQueryScenarios = [
  {
    id: 'dev-query-target-first',
    identifier: 991101,
    hasTarget: true,
    targetFirst: true,
    neighbors: [991109],
  },
  {
    id: 'dev-query-target-last',
    identifier: 991202,
    hasTarget: true,
    targetFirst: false,
    neighbors: [991201, 991199],
  },
  {
    id: 'dev-query-negative-id',
    identifier: -991301,
    hasTarget: true,
    targetFirst: true,
    neighbors: [],
  },
  {
    id: 'dev-query-zero-id',
    identifier: 0,
    hasTarget: true,
    targetFirst: false,
    neighbors: [991401],
  },
  {
    id: 'dev-query-missing-with-neighbors',
    identifier: 991502,
    hasTarget: false,
    targetFirst: true,
    neighbors: [991501],
  },
  {
    id: 'dev-query-empty-repository',
    identifier: 991601,
    hasTarget: false,
    targetFirst: true,
    neighbors: [],
  },
];
