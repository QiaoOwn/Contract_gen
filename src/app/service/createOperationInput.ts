import {createHash} from 'crypto';
import {UseCase} from '@/rm2pt/model/UseCase';
import * as projectCatalog from '@/rm2pt/project';
import {
  formatStructuredRequirement,
  getBenchmarkRequirement,
  REQUIREMENT_PROVENANCE,
} from '@/rm2pt/benchmarkRequirements';
import {createProjectContextPrompt} from './createProjectContextPrompt';
import {ProjectParam} from '../type';

export const OPERATION_INPUT_SCHEMA_VERSION = 'contractgen-operation-input-v3';

const PLACEHOLDER_PATTERNS = [
  /handles its intended business action/i,
  /required inputs are present, referenced data is valid/i,
  /applies the requested outcome, keeps data consistent/i,
];

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

export type OperationInputMetadata = Readonly<{
  schemaVersion: typeof OPERATION_INPUT_SCHEMA_VERSION;
  requirementProvenance: string;
  operationSignature: string;
  requirementHash: string;
  contextHash: string;
  inputHash: string;
}>;

export type BuiltOperationInput = Readonly<{
  content: string;
  requirement: string;
  modelContext: string;
  metadata: OperationInputMetadata;
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
  param: ProjectParam & {operation: string; userInput?: string}
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

  const canonicalRequirement = formatStructuredRequirement(
    getBenchmarkRequirement(param.project, String(param.useCase), param.operation)
  );
  const requirement = validateStructuredRequirementText(param.userInput || canonicalRequirement);
  const modelContext = createProjectContextPrompt({
    project: param.project,
    useCase: param.useCase,
  });
  const operationSignature = formatOperationSignature(operation);
  const content = [
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
    '- Use only model elements and read-only environment values declared in the supplied context.',
    '- Do not invent entities, attributes, associations, operations, types, or enumeration literals.',
    '- Cover every stated precondition and post-state obligation.',
    '- Service temporary variables listed in the context are accessed as self.<name>.',
    '- Reference the declared environment values directly as Today or Now; do not invent self.CurrentDate, self.Today, Date::now(), or numeric date placeholders.',
  ].join('\n');

  return {
    content,
    requirement,
    modelContext,
    metadata: {
      schemaVersion: OPERATION_INPUT_SCHEMA_VERSION,
      requirementProvenance: param.userInput
        ? 'user-supplied-structured-requirement'
        : REQUIREMENT_PROVENANCE,
      operationSignature,
      requirementHash: digest(requirement),
      contextHash: digest(modelContext),
      inputHash: digest(content),
    },
  };
};
