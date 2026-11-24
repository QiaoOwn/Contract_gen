import {createHash} from 'crypto';
import {UseCase} from '@/rm2pt/model/UseCase';
export {loadNarrativeOperation as buildNarrativeOperationInput} from './narrativeOperationInput';
import * as projectCatalog from '@/rm2pt/project';
import {
  formatStructuredRequirement,
  getBenchmarkRequirement,
  REQUIREMENT_PROVENANCE,
} from '@/rm2pt/benchmarkRequirements';
import {createProjectContextPrompt} from './createProjectContextPrompt';
import {ProjectParam} from '../type';
import {MODEL_INDEX_VERSION} from './modelIndex';
import {MODEL_GROUNDING_RULES_VERSION, renderModelGroundingRules} from './modelGroundingRules';
import {
  createOperationModelGrounding,
  type OperationModelGrounding,
} from './operationModelGrounding';
import {MODEL_RULE_VALIDATION_VERSION, MODEL_RULE_REPAIR_VERSION} from './modelRuleDiagnostics';
import {
  createGenerationTaskPlan,
  renderGenerationTaskPlan,
  GENERATION_CONTROL_VERSION,
  type GenerationTaskPlan,
} from './generationTaskPlan';
import {compileSemanticContractPlan, renderSemanticContractPlan, SEMANTIC_PLANNING_VERSION, type SemanticContractPlan, PlanningReviewError} from './semanticContractPlan';
import {createConstraintTaskPlan, renderConstraintTaskPlan, CONSTRAINT_TASK_VERSION, type ConstraintTaskPlan} from './constraintTaskPlan';

export const OPERATION_INPUT_SCHEMA_VERSION = 'contractgen-operation-input-v4';
export const BASE_OPERATION_INPUT_SCHEMA_VERSION = 'contractgen-operation-input-v3';
export const NO_CONTEXT_INPUT_SCHEMA_VERSION = 'contractgen-operation-input-no-context-v1';
export const CONTEXT_ABLATION_GUIDANCE_VERSION = 'context-ablation-neutral-guidance-v1';

export type ProjectContextStrategy = 'full' | 'none';

const PLACEHOLDER_PATTERNS = [
  /handles its intended business action/i,
  /required inputs are present, referenced data is valid/i,
  /applies the requested outcome, keeps data consistent/i,
];

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

export type OperationInputMetadata = Readonly<{
  schemaVersion:
    | typeof OPERATION_INPUT_SCHEMA_VERSION
    | typeof BASE_OPERATION_INPUT_SCHEMA_VERSION
    | typeof NO_CONTEXT_INPUT_SCHEMA_VERSION;
  requirementProvenance: string;
  operationSignature: string;
  contextStrategy: ProjectContextStrategy;
  contextAlgorithmVersion: string;
  requirementHash: string;
  contextHash: string;
  inputHash: string;
  generationControlVersion?: typeof GENERATION_CONTROL_VERSION;
  generationTaskPlanHash?: string;
  generationTaskCount?: number;
  explicitlyBoundTaskCount?: number;
  baseInputHash?: string;
  semanticPlanningVersion?: typeof SEMANTIC_PLANNING_VERSION;
  semanticPlanHash?: string;
  semanticPlanningPolicyHash?: string;
  constraintPlanningVersion?: typeof CONSTRAINT_TASK_VERSION;
  constraintTaskPlanHash?: string;
  constraintTaskCount?: number;
  constraintPolicyHash?: string;
  inputGuidanceVersion?: string;
  modelGroundingEnabled: boolean;
  modelIndexVersion?: typeof MODEL_INDEX_VERSION;
  modelGroundingRulesVersion?: typeof MODEL_GROUNDING_RULES_VERSION;
  modelGroundingRulesHash?: string;
  modelGroundingRulesCount?: number;
  modelRuleValidationVersion: typeof MODEL_RULE_VALIDATION_VERSION;
  modelRuleRepairVersion: typeof MODEL_RULE_REPAIR_VERSION;
  modelValidationRulesHash: string;
}>;

export type BuiltOperationInput = Readonly<{
  content: string;
  requirement: string;
  modelContext: string;
  metadata: OperationInputMetadata;
  modelGroundingContext: OperationModelGrounding;
  generationTaskPlan?: GenerationTaskPlan;
  semanticContractPlan?: SemanticContractPlan;
  constraintTaskPlan?: ConstraintTaskPlan;
}>;

export const formatOperationSignature = (operation: {
  name: string;
  parameters?: {name: string; type: string}[];
  returnType?: {type: string};
}) => {
  const parameters = (operation.parameters || [])
    .map((parameter) => parameter.name + ': ' + parameter.type)
    .join(', ');
  const returnType = operation.returnType?.type?.trim();
  return operation.name + '(' + parameters + ')' + (returnType ? ': ' + returnType : '');
};

export const validateStructuredRequirementText = (value: string) => {
  const text = value.trim();
  const problems: string[] = [];
  if (text.length < 80) {
    problems.push('the requirement is too short to encode contract-level behavior');
  }
  if (!/^Operation intent:/im.test(text)) {
    problems.push('missing Operation intent section');
  }
  if (!/^Preconditions:/im.test(text)) {
    problems.push('missing Preconditions section');
  }
  if (!/^Postconditions:/im.test(text)) {
    problems.push('missing Postconditions section');
  }
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) {
      problems.push('contains a generic placeholder sentence');
      break;
    }
  }
  if (problems.length) {
    throw new Error('Invalid structured operation requirement: ' + problems.join('; '));
  }
  return text;
};

export const buildOperationInput = (
  param: ProjectParam & {
    operation: string;
    userInput?: string;
    contextStrategy?: ProjectContextStrategy;
    contextAblationMode?: boolean;
    modelGrounding?: boolean;
    generationControl?: boolean;
    programPlanning?: boolean;
    constraintSolving?: boolean;
  }
): BuiltOperationInput => {
  const project = projectCatalog[param.project];
  const useCase = project.useCase[param.useCase as keyof typeof project.useCase] as UseCase;
  if (!useCase) {
    throw new Error('Unknown use case: ' + String(param.useCase));
  }
  const service = useCase.relatedService;
  const operation = service.operations.find((candidate) => candidate.name === param.operation);
  if (!operation) {
    throw new Error('Unknown operation: ' + param.operation);
  }

  const requirement = validateStructuredRequirementText(param.userInput || formatStructuredRequirement(
    getBenchmarkRequirement(param.project, String(param.useCase), param.operation)
  ));
  const contextStrategy = param.contextStrategy || 'full';
  if (contextStrategy !== 'full' && contextStrategy !== 'none') {
    throw new Error(`Unsupported project context strategy: ${contextStrategy}`);
  }
  if (param.modelGrounding !== undefined && typeof param.modelGrounding !== 'boolean') {
    throw new Error('modelGrounding must be a Boolean');
  }
  const modelGroundingEnabled =
    param.modelGrounding ?? (contextStrategy === 'full' && !param.contextAblationMode);
  if (modelGroundingEnabled && contextStrategy !== 'full') {
    throw new Error('Model-derived rules require full project context');
  }
  // Validation always has the typed model, including in generation-only context ablations.
  const modelGroundingContext = createOperationModelGrounding(param);
  const modelRules = modelGroundingEnabled ? modelGroundingContext.rules : undefined;
  if (param.generationControl !== undefined && typeof param.generationControl !== 'boolean')
    throw new Error('generationControl must be a Boolean');
  if (param.generationControl && !modelGroundingEnabled)
    throw new Error('Program-directed generation requires full context and model grounding');
  const generationTaskPlan = param.generationControl
    ? createGenerationTaskPlan(requirement, modelGroundingContext)
    : undefined;
  if (param.programPlanning !== undefined && typeof param.programPlanning !== 'boolean')
    throw new Error('programPlanning must be a Boolean');
  if (param.programPlanning && (!modelGroundingEnabled || param.generationControl))
    throw new Error('Semantic planning requires grounded full context and replaces the legacy task-only controller');
  const semanticContractPlan = param.programPlanning ? compileSemanticContractPlan(requirement, modelGroundingContext) : undefined;
  if (semanticContractPlan?.status === 'needs-review') throw new PlanningReviewError(semanticContractPlan);
  if (param.constraintSolving !== undefined && typeof param.constraintSolving !== 'boolean')
    throw new Error('constraintSolving must be a Boolean');
  if (param.constraintSolving && (!modelGroundingEnabled || param.generationControl || param.programPlanning))
    throw new Error('Constraint solving requires grounded full context and replaces target planning and task-only control');
  const constraintTaskPlan = param.constraintSolving ? createConstraintTaskPlan(requirement, modelGroundingContext) : undefined;
  const modelContext =
    contextStrategy === 'full'
      ? createProjectContextPrompt({
          project: param.project,
          useCase: param.useCase,
        })
      : 'No project-model context is supplied for this controlled input ablation.';
  const operationSignature = formatOperationSignature(operation);
  const groundingConstraints = param.contextAblationMode
    ? [
        '- Cover every stated precondition and post-state obligation.',
        '- Use the operation signature and requirement; incorporate project-model declarations when supplied.',
        '- Keep names and types consistent with the information available in this input.',
      ]
    : [
        '- Use only model elements and read-only environment values declared in the supplied context.',
        '- Do not invent entities, attributes, associations, operations, types, or enumeration literals.',
        '- Cover every stated precondition and post-state obligation.',
        '- Service temporary variables listed in the context are accessed as self.<name>.',
        '- Reference the declared environment values directly as Today or Now; do not invent self.CurrentDate, self.Today, Date::now(), or numeric date placeholders.',
      ];
  const baseContent = [
    'Operation metadata:',
    'Project: ' + String(param.project),
    'Use case: ' + useCase.name,
    'Service: ' + service.name,
    'Operation: ' + operation.name,
    'Signature: ' + operationSignature,
    '',
    'Structured natural-language requirement:',
    requirement,
    '',
    modelContext,
    '',
    'Grounding constraints:',
    ...groundingConstraints,
  ].join('\n');
  const groundedContent = modelRules
    ? `${baseContent}\n\n${renderModelGroundingRules(modelRules)}`
    : baseContent;
  const content = constraintTaskPlan
    ? `${groundedContent}\n\n${renderConstraintTaskPlan(constraintTaskPlan)}`
    : semanticContractPlan
    ? `${groundedContent}\n\n${renderSemanticContractPlan(semanticContractPlan)}`
    : generationTaskPlan
    ? `${groundedContent}\n\n${renderGenerationTaskPlan(generationTaskPlan)}`
    : groundedContent;

  return {
    content,
    requirement,
    modelContext,
    modelGroundingContext,
    ...(generationTaskPlan ? {generationTaskPlan} : {}),
    ...(semanticContractPlan ? {semanticContractPlan} : {}),
    ...(constraintTaskPlan ? {constraintTaskPlan} : {}),
    metadata: {
      schemaVersion:
        contextStrategy === 'full'
          ? modelGroundingEnabled
            ? OPERATION_INPUT_SCHEMA_VERSION
            : BASE_OPERATION_INPUT_SCHEMA_VERSION
          : NO_CONTEXT_INPUT_SCHEMA_VERSION,
      requirementProvenance: param.userInput
        ? 'user-supplied-structured-requirement'
        : REQUIREMENT_PROVENANCE,
      operationSignature,
      contextStrategy,
      contextAlgorithmVersion:
        contextStrategy === 'full' ? 'full-project-context-v2' : 'no-project-context-v1',
      requirementHash: digest(requirement),
      contextHash: digest(modelContext),
      inputHash: digest(content),
      modelGroundingEnabled,
      modelRuleValidationVersion: MODEL_RULE_VALIDATION_VERSION,
      modelRuleRepairVersion: MODEL_RULE_REPAIR_VERSION,
      modelValidationRulesHash: modelGroundingContext.rules.rulesHash,
      ...(constraintTaskPlan ? {
        constraintPlanningVersion: CONSTRAINT_TASK_VERSION,
        constraintTaskPlanHash: constraintTaskPlan.hash,
        constraintTaskCount: constraintTaskPlan.tasks.length,
        constraintPolicyHash: constraintTaskPlan.policyHash,
        baseInputHash: digest(groundedContent),
      } : {}),
      ...(semanticContractPlan ? {
        semanticPlanningVersion: SEMANTIC_PLANNING_VERSION,
        semanticPlanHash: semanticContractPlan.hash,
        semanticPlanningPolicyHash: semanticContractPlan.policyHash,
        baseInputHash: digest(groundedContent),
      } : {}),
      ...(generationTaskPlan
        ? {
            generationControlVersion: GENERATION_CONTROL_VERSION,
            generationTaskPlanHash: generationTaskPlan.hash,
            generationTaskCount: generationTaskPlan.tasks.length,
            explicitlyBoundTaskCount: generationTaskPlan.tasks.filter(
              (task) => task.bindingStatus === 'explicit'
            ).length,
            baseInputHash: digest(groundedContent),
          }
        : {}),
      ...(modelRules
        ? {
            modelIndexVersion: modelRules.modelIndexVersion,
            modelGroundingRulesVersion: modelRules.schemaVersion,
            modelGroundingRulesHash: modelRules.rulesHash,
            modelGroundingRulesCount: modelRules.rules.length,
          }
        : {}),
      ...(param.contextAblationMode
        ? {inputGuidanceVersion: CONTEXT_ABLATION_GUIDANCE_VERSION}
        : {}),
    },
  };
};
