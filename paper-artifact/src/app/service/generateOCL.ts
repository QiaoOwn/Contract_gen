import {ExtractStreamType, ProjectParam} from '../type';
import {graph as feedbackGraph} from './graph';
import {graph as linearGraph} from './graph-line';
import {OpenAIChatModelId} from '@langchain/openai';
import {normalizeGenerationBudget, validateGenerationMode} from './generationBudget';
import {buildOperationInput, ProjectContextStrategy} from './createOperationInput';
import type {OracleProfile} from './labAdjudicatedOracle';
import {createRepairProtocol} from './developmentBehavior/developmentRepair';
import {developmentRegistry} from './developmentBehavior/registry';
import {captureReadOnlyRepairEvidence} from './repairIntegrity';
import {generateNarrativeOCL, type NarrativeRuntimeParam} from './narrativeRuntime';
export type GenerateOCLResult = ExtractStreamType<Awaited<ReturnType<typeof generateOCL>>>;
export type GenerateOCLGraphMode = 'feedback' | 'linear' | 'paired';
export type GenerateOCLFeedbackMode = 'full' | 'raw' | 'generic' | 'candidate' | 'none';
export type GenerateOCLParam = {
  generationMode?: 'narrative-v4' | 'structured-unified' | 'legacy-structured';
  prepareOnly?: boolean;
  narrativeRequirement?: string;
  narrativeIdentity?: NarrativeRuntimeParam['narrativeIdentity'];
  narrativeRepair?: boolean;
  narrativeRepairOption?: string;
  behaviorEvaluation?: boolean;
  apiKey: string;
  operation: string;
  model: OpenAIChatModelId;
  userInput?: string;
  contextStrategy?: ProjectContextStrategy;
  contextAblationMode?: boolean;
  modelGrounding?: boolean;
  developmentBehavior?: boolean;
  generationControl?: boolean;
  programPlanning?: boolean;
  constraintSolving?: boolean;
  planCompletion?: 'automatic' | 'model';
  graphMode?: GenerateOCLGraphMode;
  feedbackMode?: GenerateOCLFeedbackMode;
  oracleProfile?: OracleProfile;
  maxGenerationAttempts?: number;
  initialOcl?: {
    definition: string;
    precondition: string;
    postcondition: string;
  };
  initialGenerationCount?: number;
  graph?: typeof feedbackGraph | typeof linearGraph;
} & ProjectParam;
export function resolveGenerationArchitecture(param: Partial<GenerateOCLParam>) {
  if (param.generationMode && !['narrative-v4', 'structured-unified', 'legacy-structured'].includes(param.generationMode)) throw new Error('Unknown generation architecture');
  if ((param.generationMode === 'narrative-v4' || param.generationMode === 'structured-unified') && (param.constraintSolving || param.programPlanning || param.generationControl || param.initialOcl || param.graph ||
      param.graphMode || param.feedbackMode || param.developmentBehavior || param.planCompletion ||
      param.oracleProfile && param.oracleProfile !== 'rm2pt-authoritative-preparation-v4'))
    throw new Error('Narrative mode cannot mix Legacy graph/planning switches');
  // Historical callers with an explicit old graph/control configuration retain their old path.
  return param.generationMode ?? (param.constraintSolving || param.programPlanning || param.generationControl || param.initialOcl || param.graph ||
    param.graphMode || param.feedbackMode || param.developmentBehavior ? 'legacy-structured' : 'narrative-v4');
}
export const generateOCL = async (param: GenerateOCLParam) => {
  if (resolveGenerationArchitecture(param) !== 'legacy-structured') return generateNarrativeOCL(param);
  return generateLegacyOCL(param);
};
export const generateLegacyOCL = async (param: GenerateOCLParam) => {
  const {
    project: key,
    useCase: uc,
    operation: op,
    model,
    userInput,
    contextStrategy = 'full',
    contextAblationMode = false,
    modelGrounding,
    graphMode = 'feedback',
    feedbackMode = graphMode === 'linear' ? 'none' : 'full',
    maxGenerationAttempts,
    initialOcl,
    initialGenerationCount,
    graph,
  } = param;
  validateGenerationMode(graphMode, feedbackMode, Boolean(initialOcl));
  if (param.developmentBehavior !== undefined && typeof param.developmentBehavior !== 'boolean')
    throw new Error('developmentBehavior must be a Boolean');
  if (param.programPlanning !== undefined && typeof param.programPlanning !== 'boolean')
    throw new Error('programPlanning must be a Boolean');
  if (param.planCompletion !== undefined && !['automatic', 'model'].includes(param.planCompletion))
    throw new Error('planCompletion must be automatic or model');
  if (param.planCompletion && !param.programPlanning) throw new Error('planCompletion requires programPlanning');
  if (param.programPlanning && (initialOcl || feedbackMode !== 'full' || graphMode !== 'feedback' || (graph && graph !== feedbackGraph)))
    throw new Error('Semantic planning requires an unseeded full-feedback graph; it does not reuse arbitrary full-contract seeds');
  if (param.constraintSolving !== undefined && typeof param.constraintSolving !== 'boolean')
    throw new Error('constraintSolving must be a Boolean');
  if (param.constraintSolving && (param.programPlanning || param.generationControl || initialOcl || param.planCompletion ||
      feedbackMode !== 'full' || graphMode !== 'feedback' || (graph && graph !== feedbackGraph)))
    throw new Error('Constraint solving requires unseeded full feedback; target planning, automatic completion and task-only control are disabled');
  const generationControl = param.generationControl ?? (!param.programPlanning && !param.constraintSolving && Boolean(param.developmentBehavior));
  if (typeof generationControl !== 'boolean')
    throw new Error('generationControl must be a Boolean');
  if (
    generationControl &&
    (feedbackMode !== 'full' || graphMode === 'linear' || (graph && graph !== feedbackGraph))
  )
    throw new Error('Program-directed generation currently requires the full-feedback graph');
  if (
    param.developmentBehavior &&
    (feedbackMode !== 'full' || graphMode === 'linear' || (graph && graph !== feedbackGraph))
  )
    throw new Error(
      'Development repair requires full feedback and the feedback or paired graph; other ablation arms are not yet covered.'
    );
  if (param.developmentBehavior)
    developmentRegistry.require({project: key, useCase: uc, operation: op});
  const generationBudget = normalizeGenerationBudget(maxGenerationAttempts);
  const g = graph ?? (graphMode === 'linear' ? linearGraph : feedbackGraph);
  const seededGenerationCount = graphMode === 'paired' ? (initialGenerationCount ?? 1) : 0;
  if (seededGenerationCount < 0 || seededGenerationCount >= generationBudget) {
    throw new Error(
      `Invalid initialGenerationCount=${seededGenerationCount}; paired repair requires remaining generation budget.`
    );
  }
  const operationInput = buildOperationInput({
    project: key,
    useCase: uc,
    operation: op,
    userInput,
    contextStrategy,
    contextAblationMode,
    modelGrounding,
    generationControl,
    programPlanning: param.programPlanning,
    constraintSolving: param.constraintSolving,
  });
  const graphInput = {
    ...param,
    model,
    maxGenerationAttempts: generationBudget,
    generationCount: seededGenerationCount,
    ...(initialOcl ? {ocl: initialOcl} : {}),
    inputMetadata: operationInput.metadata,
    modelGroundingContext: operationInput.modelGroundingContext,
    developmentRequirement: operationInput.requirement,
    generationTaskPlan: operationInput.generationTaskPlan ?? null,
    semanticContractPlan: operationInput.semanticContractPlan ?? null,
    constraintTaskPlan: operationInput.constraintTaskPlan ?? null,
    taskSolutionIssues: [],
    taskSolutionAudit: null,
    planCompletion: param.planCompletion ?? 'automatic',
    planSlotFills: {},
    planCompletionIssues: [],
    repairProtocol: createRepairProtocol(Boolean(param.developmentBehavior)),
    messages: [
      {
        role: 'user',
        content: operationInput.content,
      },
    ],
  };
  const readOnlyRepairEvidence =
    param.developmentBehavior || generationControl || param.programPlanning || param.constraintSolving
      ? captureReadOnlyRepairEvidence(
          graphInput,
          param.developmentBehavior
            ? developmentRegistry.require({project: key, useCase: uc, operation: op}).sources
            : []
        )
      : null;
  const feedbackGraphInput = {
    ...graphInput,
    readOnlyRepairEvidence,
    feedbackMode,
  };
  const stream = await g.stream(graphMode === 'linear' ? graphInput : feedbackGraphInput, {
    configurable: {
      thread_id: new Date().getTime(),
    },
    recursionLimit: param.developmentBehavior
      ? generationBudget * 6 + 10
      : generationBudget * 5 + 8,
  });
  return stream;
};
