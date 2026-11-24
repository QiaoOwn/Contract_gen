import type {ModelSource} from './modelIndex';
import type {ModelRuleFamily} from './modelGroundingRules';
import {requirementPreservationPolicy} from './repairTaxonomy';

export const MODEL_RULE_VALIDATION_VERSION = 'model-rule-validation-v1';
export const MODEL_RULE_REPAIR_VERSION = 'model-rule-guided-repair-v1';
export type ContractClause = 'definition' | 'precondition' | 'postcondition';
export type OclLocation = {
  clause: ContractClause;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  startOffset: number;
  endOffset: number;
  expression: string;
};
export type ModelRuleDiagnostic = OclLocation & {
  kind: 'model-rule';
  code: string;
  family: ModelRuleFamily;
  ruleIds: string[];
  modelElementIds: string[];
  modelEvidence: {id: string; declaration: string; source: ModelSource | null}[];
  msg: string;
  repair: string;
  rootBindingId?: string;
  relatedLocations: OclLocation[];
};

const repairPolicies: Record<ModelRuleFamily, string> = {
  'MG-01':
    'Check the declared model vocabulary. Do not create or rename model declarations to accommodate the candidate.',
  'MG-02':
    'Check the receiver binding and the attribute owner/type. Change only the inconsistent binding or access, according to the requirement.',
  'MG-03':
    'Check the association target, collection shape, and element binding together. Do not change links or cardinalities merely to satisfy the checker.',
  'MG-04':
    'Check the declared inheritance and the receiver binding. A type-test branch alone does not narrow a base-typed binding; do not invent an unsupported cast.',
  'MG-05':
    'Use an exact declared enumeration literal only when it expresses the requirement. Do not pick an arbitrary valid literal.',
  'MG-06':
    'Check lexical bindings, parameters and self state. Restore a missing binding only when its source is justified by the requirement and model.',
  'MG-07':
    'Keep result only in the postcondition and respect the declared return type. Determine its value from the requirement, not from the type alone.',
};
export const modelRuleRepairPolicy = (family: ModelRuleFamily) => repairPolicies[family];

export const isModelRuleDiagnostic = (value: {msg: string}): value is ModelRuleDiagnostic =>
  'kind' in value && value.kind === 'model-rule';

export const renderModelRuleRepair = (diagnostics: ModelRuleDiagnostic[]) =>
  [
    `Model-grounded repair policy: ${MODEL_RULE_REPAIR_VERSION}`,
    'Prioritize a reported binding conflict before its dependent uses. These are structural diagnostics, not new business requirements.',
    requirementPreservationPolicy,
    'Return the complete definition/precondition/postcondition JSON. The revised candidate will undergo the full validation pipeline again.',
    ...diagnostics.flatMap((error) => [
      `[${error.family}/${error.code}] ${error.clause}, line ${error.line}, column ${error.column}: ${error.msg}`,
      `OCL: ${error.expression}`,
      ...error.modelEvidence.map(
        (evidence) => `Model declaration: ${evidence.declaration} [${evidence.id}]`
      ),
      ...(error.relatedLocations.length
        ? [
            `Dependent uses to recheck: ${error.relatedLocations.map((site) => `${site.clause}:${site.line}:${site.column} ${site.expression}`).join('; ')}`,
          ]
        : []),
      `Repair scope: ${error.repair}`,
    ]),
  ].join('\n');
