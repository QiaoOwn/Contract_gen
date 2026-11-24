import type {DevelopmentObligation, DevelopmentSource} from './types';

export const COCOME_MODIFICATIONS_CLOCK = '2026-01-15T12:00:00+08:00';
export const cocomeModificationsSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/RequirementDocument.md',
    sha256: '0d16f7590884c8f41774ff54038f1174757d3dd6f1416011d0ad773b7c2fb7dc',
    note: 'Individually inspected OP22, OP26, OP30, OP34 and OP42. The requirement document and its generating model share one origin.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel',
    sha256: '5756182ccc1003c3e1ecaa42983f7fc723511e387f31b097da1266b046478dd9',
    note: 'Only explicitly specified attribute assignments and the true return are checked; no frame, uniqueness, cascade or rollback obligation is inferred.',
  },
];
export const cocomeModificationOperations = [
  'modifyStore',
  'modifyProductCatalog',
  'modifyCashDesk',
  'modifyCashier',
  'modifySupplier',
] as const;
export type CocomeModificationOperation = (typeof cocomeModificationOperations)[number];
type Field = {
  attribute: 'Id' | 'Name' | 'Address' | 'IsOpened';
  parameter: 'id' | 'name' | 'address' | 'isopened';
  type: 'Integer' | 'String' | 'Boolean';
  modelLine: number;
  obligationId: string;
};
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
  fields: Field[];
  resultObligationId: string;
  obligations: DevelopmentObligation[];
};
const specification = (
  operation: CocomeModificationOperation,
  entity: string,
  useCase: Specification['useCase'],
  documentDefinition: number,
  documentPrecondition: number,
  documentPostcondition: number,
  modelDefinition: number,
  modelPrecondition: number,
  assignments: {
    attribute: Field['attribute'];
    parameter: Field['parameter'];
    type: Field['type'];
    modelLine: number;
  }[],
  modelResult: number
): Specification => {
  const fields = assignments.map((field, index) => ({
    ...field,
    obligationId: `Q${String(index + 1).padStart(2, '0')}`,
  }));
  const resultObligationId = `Q${String(fields.length + 1).padStart(2, '0')}`;
  return {
    id: `CoCoME_${useCase}_${operation}`,
    entity,
    useCase,
    service: `Manage${entity}CRUDService`,
    schemaVersion: `development-behavior-cocome-${operation}-v1`,
    fields,
    resultObligationId,
    obligations: [
      {
        id: 'P01',
        clause: 'precondition',
        requirement: `The supplied identifier must identify an existing ${entity}.`,
        documentLine: documentPrecondition,
        modelLines: [modelPrecondition, modelPrecondition],
        modelFeatures: [`${entity}.Id`, '$parameter.id'],
        evidenceNote: `The target is selected by Id at document line ${documentDefinition} and model line ${modelDefinition}. No positive-identifier or uniqueness guard is added.`,
      },
      ...fields.map(
        (field): DevelopmentObligation => ({
          id: field.obligationId,
          clause: 'postcondition',
          requirement: `The referenced ${entity}.${field.attribute} must equal the supplied ${field.parameter} after the operation.`,
          documentLine: documentPostcondition,
          modelLines: [field.modelLine, field.modelLine],
          modelFeatures: [
            `${entity}.Id`,
            '$parameter.id',
            `${entity}.${field.attribute}`,
            `$parameter.${field.parameter}`,
          ].filter((item, index, all) => all.indexOf(item) === index),
          localizationTargets: [`${entity}.${field.attribute}`],
          evidenceNote:
            'This field assignment is explicit in the source postcondition. No other field or association update is inferred.',
        })
      ),
      {
        id: resultObligationId,
        clause: 'postcondition',
        requirement: 'A successful modification must return true.',
        documentLine: documentPostcondition,
        modelLines: [modelResult, modelResult],
        modelFeatures: ['$result'],
      },
    ],
  };
};
// Explicit per-operation field lists preserve the original parameter order and source semantics.
export const cocomeModificationSpecifications: Record<CocomeModificationOperation, Specification> =
  {
    modifyStore: specification(
      'modifyStore',
      'Store',
      'manageStore',
      3213,
      3217,
      3221,
      941,
      948,
      [
        {attribute: 'Id', parameter: 'id', type: 'Integer', modelLine: 959},
        {attribute: 'Name', parameter: 'name', type: 'String', modelLine: 960},
        {attribute: 'Address', parameter: 'address', type: 'String', modelLine: 961},
        {attribute: 'IsOpened', parameter: 'isopened', type: 'Boolean', modelLine: 962},
      ],
      963
    ),
    modifyProductCatalog: specification(
      'modifyProductCatalog',
      'ProductCatalog',
      'manageProductCatalog',
      3499,
      3503,
      3507,
      1071,
      1078,
      [
        {attribute: 'Id', parameter: 'id', type: 'Integer', modelLine: 1087},
        {attribute: 'Name', parameter: 'name', type: 'String', modelLine: 1088},
      ],
      1089
    ),
    modifyCashDesk: specification(
      'modifyCashDesk',
      'CashDesk',
      'manageCashDesk',
      3783,
      3787,
      3791,
      1199,
      1206,
      [
        {attribute: 'Id', parameter: 'id', type: 'Integer', modelLine: 1216},
        {attribute: 'Name', parameter: 'name', type: 'String', modelLine: 1217},
        {attribute: 'IsOpened', parameter: 'isopened', type: 'Boolean', modelLine: 1218},
      ],
      1219
    ),
    modifyCashier: specification(
      'modifyCashier',
      'Cashier',
      'manageCashier',
      4067,
      4071,
      4075,
      1327,
      1334,
      [
        {attribute: 'Id', parameter: 'id', type: 'Integer', modelLine: 1343},
        {attribute: 'Name', parameter: 'name', type: 'String', modelLine: 1344},
      ],
      1345
    ),
    modifySupplier: specification(
      'modifySupplier',
      'Supplier',
      'manageSupplier',
      4643,
      4647,
      4651,
      1591,
      1598,
      [
        {attribute: 'Id', parameter: 'id', type: 'Integer', modelLine: 1607},
        {attribute: 'Name', parameter: 'name', type: 'String', modelLine: 1608},
      ],
      1609
    ),
  };
export const cocomeModificationScenarios = [
  {
    id: 'dev-modify-target-first',
    identifier: 993101,
    hasTarget: true,
    targetFirst: true,
    neighbors: [993109],
    name: 'Renamed alpha',
    address: '11 New Road',
    isopened: true,
  },
  {
    id: 'dev-modify-target-last',
    identifier: 993202,
    hasTarget: true,
    targetFirst: false,
    neighbors: [993201, 993199],
    name: 'Renamed beta',
    address: '22 New Road',
    isopened: false,
  },
  {
    id: 'dev-modify-negative-id-empty-text',
    identifier: -993301,
    hasTarget: true,
    targetFirst: true,
    neighbors: [],
    name: '',
    address: '',
    isopened: false,
  },
  {
    id: 'dev-modify-zero-id-quoted-text',
    identifier: 0,
    hasTarget: true,
    targetFirst: false,
    neighbors: [993401],
    name: 'Name with \'quotes\' and "double quotes"',
    address: 'Floor 2 / Block B',
    isopened: true,
  },
  {
    id: 'dev-modify-missing-with-neighbors',
    identifier: 993502,
    hasTarget: false,
    targetFirst: true,
    neighbors: [993501],
    name: 'Missing',
    address: 'Missing address',
    isopened: true,
  },
  {
    id: 'dev-modify-empty-repository',
    identifier: 993601,
    hasTarget: false,
    targetFirst: true,
    neighbors: [],
    name: 'Missing',
    address: 'Missing address',
    isopened: false,
  },
];
export const plannedModificationChecks = (operation: CocomeModificationOperation) =>
  cocomeModificationScenarios.reduce(
    (sum, scenario) =>
      sum +
      (scenario.hasTarget ? cocomeModificationSpecifications[operation].obligations.length : 1),
    0
  );
