import {UseCase} from '@/rm2pt/model/UseCase';
import * as typescript from 'typescript';
import * as jestRunner from 'jest';
import * as project from '@/rm2pt/project';
import * as babel from '@babel/core';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import type {CoverageSummary} from 'istanbul-lib-coverage';
import {OpenAIChatModelId} from '@langchain/openai';
import {whatIsDefinition, whatIsPrecondition, whatIsPostcondition} from '../constant';
import {Annotation, MessagesAnnotation, StateGraph} from '@langchain/langgraph';
import {z} from 'zod';
import {HumanMessage} from '@langchain/core/messages';
import {formatContract, generateContractCode, parse} from '../util';
import {createGlobalEntryCode, createIsolatedTestRuntime} from './createGlobalEntryCode';
import {buildEntryCode, createEntryCode} from './createEntryCode';
import path from 'path';
import fs from 'fs-extra';
import {randomUUID} from 'crypto';
import generate from '@babel/generator';
import {GenerateOCLParam} from './generateOCL';
import {generateOclWithJsonModeDetailed, OclGenerationUsage} from './generateOclWithJsonMode';
import {routeAfterValidation, routeGenerationEntry} from './generationBudget';
import {OperationInputMetadata} from './createOperationInput';
import {createOCLGenerationMessages} from './createOCLGenerationMessages';
import {summarizeJestResults} from './summarizeJestResults';
import {validateGeneratedContractSemantics} from './validateGeneratedContractSemantics';
import {
  createOperationModelGrounding,
  type OperationModelGrounding,
} from './operationModelGrounding';
import {
  validateModelGroundedContract,
  type ModelRuleValidationResult,
} from './validateModelGroundedContract';
import {
  boundaryOraclePath,
  historicalOraclePath,
  writeCandidateBoundaryOracle,
} from './labAdjudicatedOracle';
import {unifyStaticDiagnostics, type RepairDiagnostic} from './repairDiagnostics';
import {classifyRepairDiagnostic} from './repairTaxonomy';
import {repairGuardDiagnostic, RepairGuardError} from './repairGuards';
import {assertReadOnlyRepairEvidence, type ReadOnlyRepairEvidence} from './repairIntegrity';
import {auditRepairChange, type RepairChangeAudit} from './repairLocalization';
import {generationMessageTrace, type GenerationMessageTrace} from './generationMessageTrace';
import {createOCLGenerationSystemPrompt} from './createOCLGenerationSystemPrompt';
import {assertSemanticContractPlan, type SemanticContractPlan, type PlanExpression} from './semanticContractPlan';
import type {PlanCompletionIssue} from './completeSemanticPlan';
import {executeProgramOwnedGeneration, planCompletionDiagnostics} from './programOwnedGeneration';
import {assertConstraintTaskPlan, taskSolutionDiagnostics, type ConstraintTaskPlan, type TaskSolutionIssue} from './constraintTaskPlan';
import {executeConstraintSolving} from './constraintSolving';
import type {ConstraintControlRecord} from './constraintRepairControl';
import {
  auditGenerationTasks,
  assertGenerationTaskPlan,
  type GenerationTaskPlan,
  type GenerationTaskAudit,
} from './generationTaskPlan';
import {
  createRepairDirective,
  renderRepairDirective,
  auditDirectedRepair,
  type DirectedRepairAudit,
} from './directedRepair';
import {evaluateDevelopmentBehavior} from './developmentBehavior/evaluateDevelopmentBehavior';
import {
  developmentRepairDiagnostics,
  routeAfterDevelopment,
  type DevelopmentBehaviorReport,
  type RepairProtocol,
} from './developmentBehavior/developmentRepair';
const openAIBaseURL = process.env.OPENAI_BASE_URL || 'https://api.apiyi.com/v1';
const contractSchema = z.object({
  definition: z.string().nullable().describe(whatIsDefinition),
  precondition: z.string().describe(whatIsPrecondition),
  postcondition: z.string().describe(whatIsPostcondition),
});
type E = {
  line: number;
  column: number;
  msg: string;
};

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  model: Annotation<OpenAIChatModelId>,
  project: Annotation<GenerateOCLParam['project']>,
  useCase: Annotation<GenerateOCLParam['useCase']>,
  apiKey: Annotation<GenerateOCLParam['apiKey']>,
  operation: Annotation<GenerateOCLParam['operation']>,
  userInput: Annotation<GenerateOCLParam['userInput']>,
  oracleProfile: Annotation<GenerateOCLParam['oracleProfile']>,
  feedbackMode: Annotation<GenerateOCLParam['feedbackMode']>,
  developmentBehavior: Annotation<boolean>,
  developmentRequirement: Annotation<string>,
  developmentValidation: Annotation<DevelopmentBehaviorReport | null>,
  developmentInfrastructureError: Annotation<string | null>,
  repairProtocol: Annotation<RepairProtocol>,
  repairDiagnostics: Annotation<RepairDiagnostic[]>,
  readOnlyRepairEvidence: Annotation<ReadOnlyRepairEvidence | null>,
  repairChangeAudit: Annotation<RepairChangeAudit | null>,
  directedRepairAudit: Annotation<DirectedRepairAudit | null>,
  generationTaskPlan: Annotation<GenerationTaskPlan | null>,
  generationTaskAudit: Annotation<GenerationTaskAudit | null>,
  semanticContractPlan: Annotation<SemanticContractPlan | null>,
  constraintTaskPlan: Annotation<ConstraintTaskPlan | null>,
  constraintRepairControl: Annotation<ConstraintControlRecord | null>,
  taskSolutionIssues: Annotation<TaskSolutionIssue[]>,
  taskSolutionAudit: Annotation<Awaited<ReturnType<typeof executeConstraintSolving>>['audit'] | null>,
  planCompletion: Annotation<'automatic' | 'model'>,
  planSlotFills: Annotation<Record<string, PlanExpression>>,
  planCompletionIssues: Annotation<PlanCompletionIssue[]>,
  planProposal: Annotation<unknown>,
  planProposalAudit: Annotation<Awaited<ReturnType<typeof executeProgramOwnedGeneration>>['proposalAudit']>,
  planExecution: Annotation<Awaited<ReturnType<typeof executeProgramOwnedGeneration>>['execution'] | null>,
  feedbackUsed: Annotation<boolean>,
  maxGenerationAttempts: Annotation<GenerateOCLParam['maxGenerationAttempts']>,
  generationCount: Annotation<number>,
  generationUsage: Annotation<OclGenerationUsage>,
  generationRequestTrace: Annotation<GenerationMessageTrace | null>,
  inputMetadata: Annotation<OperationInputMetadata>,
  modelGroundingContext: Annotation<OperationModelGrounding>,
  modelRuleValidation: Annotation<ModelRuleValidationResult | null>,
  contractSyntaxValid: Annotation<boolean>,
  promptMetadata: Annotation<{
    version: string;
    hash: string;
    generationConfigVersion: string;
    generationConfigHash: string;
    generationGrammarVersion: string;
    generationGrammarHash: string;
    generationRulesVersion: string;
    generationRulesHash: string;
    outputMode: string;
    temperature: number;
    maxTokens: number;
    basePromptVersion?: string;
    basePromptHash?: string;
  }>,
  ocl: Annotation<{
    definition: string;
    precondition: string;
    postcondition: string;
  }>,
  contract: Annotation<string>,
  typescript: Annotation<Awaited<ReturnType<typeof createEntryCode>>>,
  result: Annotation<ReturnType<typeof summarizeJestResults>>,
  methodAccepted: Annotation<boolean>,
  summary: Annotation<CoverageSummary>,
  contractErrors: Annotation<E[]>,
  typescriptErrors: Annotation<E[]>,
});
const assertReadOnlyInput = (state: typeof StateAnnotation.State) => {
  if (state.developmentBehavior || state.generationTaskPlan || state.semanticContractPlan || state.constraintTaskPlan) {
    if (!state.readOnlyRepairEvidence)
      throw new RepairGuardError('READ_ONLY_EVIDENCE_MISSING', 'stop development repair.');
    assertReadOnlyRepairEvidence(state.readOnlyRepairEvidence, state);
    if (state.generationTaskPlan)
      assertGenerationTaskPlan(state.generationTaskPlan, state.modelGroundingContext);
    if (state.semanticContractPlan) assertSemanticContractPlan(state.semanticContractPlan, state.modelGroundingContext);
    if (state.constraintTaskPlan) assertConstraintTaskPlan(state.constraintTaskPlan, state.modelGroundingContext);
  }
};
const oclGeneratorNode = async (state: typeof StateAnnotation.State) => {
  assertReadOnlyInput(state);
  if (state.constraintTaskPlan) {
    const result = await executeConstraintSolving({
      plan: state.constraintTaskPlan, context: state.modelGroundingContext,
        requirement: state.developmentRequirement, inputHash: state.inputMetadata.inputHash,
      input: String(state.messages[0].content), model: state.model, apiKey: state.apiKey,
      baseURL: openAIBaseURL, previous: state.ocl, diagnostics: state.repairDiagnostics ?? [],
      previousProposal: state.taskSolutionAudit?.proposal,
    });
    assertReadOnlyInput(state);
    return {
      ocl: result.ocl, constraintTaskPlan: state.constraintTaskPlan,
      taskSolutionIssues: result.issues, taskSolutionAudit: result.audit,
      directedRepairAudit: result.scopeAudit, repairChangeAudit: null,
      generationRequestTrace: result.trace, generationUsage: result.usage,
      generationCount: (state.generationCount ?? 0) + 1,
      feedbackUsed: Boolean(state.repairDiagnostics?.length),
      contractErrors: [], typescriptErrors: [], repairDiagnostics: [],
      modelRuleValidation: null, developmentValidation: null, developmentInfrastructureError: null,
      inputMetadata: state.inputMetadata, repairProtocol: state.repairProtocol,
      promptMetadata: result.promptMetadata,
    };
  }
  if (state.semanticContractPlan) {
    const result = await executeProgramOwnedGeneration({plan: state.semanticContractPlan, context: state.modelGroundingContext,
      mode: state.planCompletion ?? 'automatic', accepted: state.planSlotFills ?? {}, issues: state.planCompletionIssues ?? [],
      model: state.model, apiKey: state.apiKey, baseURL: openAIBaseURL});
    assertReadOnlyInput(state);
    const base = createOCLGenerationSystemPrompt();
    return {
      ocl: result.ocl, planSlotFills: result.accepted, planCompletionIssues: result.issues,
      planExecution: result.execution, semanticContractPlan: state.semanticContractPlan,
      generationRequestTrace: result.trace, planProposal: result.rawProposal,
      planProposalAudit: result.proposalAudit,
      generationUsage: result.usage,
      generationCount: (state.generationCount ?? 0) + result.execution.actualLlmCalls,
      feedbackUsed: (state.planCompletionIssues?.length ?? 0) > 0,
      contractErrors: [], typescriptErrors: [], repairDiagnostics: [], modelRuleValidation: null,
      inputMetadata: state.inputMetadata, repairProtocol: state.repairProtocol,
      promptMetadata: {version: result.trace ? 'semantic-plan-executor-v2' : 'deterministic-plan-compiler-v2',
        hash: result.execution.promptHash ?? state.semanticContractPlan.hash,
        basePromptVersion: base.version, basePromptHash: base.hash,
        generationConfigVersion: base.generationConfig.version, generationConfigHash: base.generationConfig.hash,
        generationGrammarVersion: base.components.grammar.version, generationGrammarHash: base.components.grammar.hash,
        generationRulesVersion: base.components.generationRules.version, generationRulesHash: base.components.generationRules.hash,
        outputMode: base.generationConfig.outputMode, temperature: base.generationConfig.temperature, maxTokens: base.generationConfig.maxTokens},
    };
  }
  const {apiKey, messages, userInput} = state;
  const feedbackMode = state.feedbackMode || 'full';
  const {
    messages: newMessages,
    systemPrompt,
    hasError,
  } = createOCLGenerationMessages({
    messages,
    feedbackMode,
    previousOcl: state.ocl,
    contract: state.contract,
    contractErrors: state.contractErrors,
    typescriptErrors: state.typescriptErrors,
    repairDiagnostics: state.repairDiagnostics,
  });
  if (state.generationTaskPlan && hasError && state.ocl && feedbackMode === 'full') {
    const directive = createRepairDirective(
      state.ocl,
      state.repairDiagnostics ?? [],
      state.modelGroundingContext
    );
    newMessages.push(new HumanMessage(renderRepairDirective(directive, state.generationTaskPlan)));
  }

  const generation = await generateOclWithJsonModeDetailed({
    model: state.model,
    apiKey,
    baseURL: openAIBaseURL,
    messages: newMessages,
    schema: contractSchema,
  });
  assertReadOnlyInput(state);
  const repairChangeAudit =
    state.developmentBehavior && hasError && state.ocl
      ? auditRepairChange(
          state.ocl,
          generation.ocl,
          state.modelGroundingContext,
          state.repairDiagnostics ?? []
        )
      : null;
  const directedRepairAudit =
    state.generationTaskPlan && hasError && state.ocl
      ? auditDirectedRepair(
          state.ocl,
          generation.ocl,
          state.modelGroundingContext,
          state.repairDiagnostics ?? []
        )
      : null;
  return {
    ocl: generation.ocl,
    repairChangeAudit,
    directedRepairAudit,
    generationTaskPlan: state.generationTaskPlan ?? null,
    generationTaskAudit: null,
    ...(state.developmentBehavior || state.generationTaskPlan
      ? {generationRequestTrace: generationMessageTrace(String(state.model), newMessages)}
      : {}),
    generationUsage: generation.usage,
    contractErrors: [],
    typescriptErrors: [],
    modelRuleValidation: null,
    developmentValidation: null,
    developmentInfrastructureError: null,
    repairDiagnostics: [],
    model: state.model,
    userInput,
    feedbackMode,
    feedbackUsed: hasError && feedbackMode !== 'none',
    generationCount: (state.generationCount || 0) + 1,
    inputMetadata: state.inputMetadata,
    repairProtocol: state.repairProtocol,
    promptMetadata: {
      version: systemPrompt.version,
      hash: systemPrompt.hash,
      generationConfigVersion: systemPrompt.generationConfig.version,
      generationConfigHash: systemPrompt.generationConfig.hash,
      generationGrammarVersion: systemPrompt.components.grammar.version,
      generationGrammarHash: systemPrompt.components.grammar.hash,
      generationRulesVersion: systemPrompt.components.generationRules.version,
      generationRulesHash: systemPrompt.components.generationRules.hash,
      outputMode: systemPrompt.generationConfig.outputMode,
      temperature: systemPrompt.generationConfig.temperature,
      maxTokens: systemPrompt.generationConfig.maxTokens,
    },
  };
};

const contractGeneratorNode = async (state: typeof StateAnnotation.State) => {
  assertReadOnlyInput(state);
  const {project: key, useCase: uc, operation: op, ocl} = state;
  const p = project[key];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const contract = generateContractCode({
    serviceName: service.name,
    operationName: operation.name,
    parameters: operation.parameters,
    returnedType: operation.returnType?.type,
    ...ocl,
  });
  const {errors: parserErrors, tree, tokens} = parse(contract);
  const semanticErrors =
    parserErrors.length === 0 && tree
      ? validateGeneratedContractSemantics({
          tree,
          hasReturnValue: Boolean(operation.returnType?.type),
        })
      : [];
  const modelRuleValidation =
    parserErrors.length === 0 && semanticErrors.length === 0 && tree
      ? validateModelGroundedContract({
          tree,
          context: state.modelGroundingContext || createOperationModelGrounding(state),
        })
      : null;
  const generationTaskAudit =
    state.generationTaskPlan && modelRuleValidation
      ? auditGenerationTasks(state.generationTaskPlan, ocl, state.modelGroundingContext)
      : null;
  const taskDiagnostics = [
    ...(generationTaskAudit?.diagnostics ?? []),
    ...(state.constraintTaskPlan ? taskSolutionDiagnostics(state.constraintTaskPlan, state.taskSolutionIssues ?? []) : []),
  ];
  const completionDiagnostics = state.semanticContractPlan
    ? planCompletionDiagnostics(state.semanticContractPlan, state.planCompletionIssues ?? []) : [];
  const planBackendErrors = state.semanticContractPlan && (parserErrors.length || semanticErrors.length || modelRuleValidation?.diagnostics.length)
    ? [repairGuardDiagnostic('PLANNING_REVIEW_REQUIRED', 'A program-owned contract failed backend validation. Review the planner or unsupported construct; do not rewrite fixed semantics with an LLM.')] : [];
  const scopeError: RepairDiagnostic[] =
    state.repairChangeAudit?.blocked || state.directedRepairAudit?.blocked
      ? [
          repairGuardDiagnostic(
            'REPAIR_SCOPE_VIOLATION',
            `Repair changed protected clauses or expressions. Review the change audit; the model and requirements remain unchanged.`
          ),
        ]
      : [];
  const contractErrors = [
    ...parserErrors,
    ...semanticErrors,
    ...(modelRuleValidation?.diagnostics || []),
    ...taskDiagnostics.map((item) => ({
      line: item.location.line ?? 0,
      column: item.location.column ?? 0,
      msg: item.msg,
      code: item.code,
    })),
    ...completionDiagnostics.map((item) => ({line: 0, column: 0, code: item.code, msg: item.msg})),
    ...planBackendErrors.map((item) => ({line: 0, column: 0, code: item.code, msg: item.msg})),
    ...scopeError.map((item) => ({line: 0, column: 0, msg: item.msg})),
  ];
  return {
    modelRuleValidation,
    generationTaskAudit,
    contractSyntaxValid: parserErrors.length === 0 && semanticErrors.length === 0,
    contractErrors,
    repairDiagnostics: [
      ...unifyStaticDiagnostics('parser', parserErrors),
      ...unifyStaticDiagnostics('subset', semanticErrors),
      ...unifyStaticDiagnostics('model', modelRuleValidation?.diagnostics ?? []),
      ...taskDiagnostics,
      ...completionDiagnostics,
      ...planBackendErrors,
      ...scopeError,
    ],
    contract: contractErrors.length === 0 && tree ? formatContract(tree, tokens) : contract,
  };
};

const typescriptGeneratorNode = async (state: typeof StateAnnotation.State) => {
  assertReadOnlyInput(state);
  try {
    const typescript = await createEntryCode(state);
    assertReadOnlyInput(state);
    return {
      typescript,
      typescriptErrors: [],
      repairDiagnostics: [],
    };
  } catch (error) {
    assertReadOnlyInput(state);
    const diagnostic = {
      line: 0,
      column: 0,
      msg: error instanceof Error ? error.message : String(error),
      code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
    };
    return {
      typescriptErrors: [diagnostic],
      repairDiagnostics: [...unifyStaticDiagnostics('lowering', [diagnostic]),
        ...(state.semanticContractPlan ? [repairGuardDiagnostic('PLANNING_REVIEW_REQUIRED', 'Review program-owned lowering failure; fixed semantics cannot be freely rewritten.')] : [])],
    };
  }
};

const typescriptParserNode = async (state: typeof StateAnnotation.State) => {
  assertReadOnlyInput(state);
  const {typescript: tsCode} = state;
  const prefix = `langchain_ocl/${new Date().getTime()}`;
  const entryFileName: string = `/${prefix}/entry/index.ts`;
  const globalEntryFileName: string = `/${prefix}/globalEntry.ts`;
  const dayjsFileName = `/${prefix}/dayjs.ts`;
  const compilerOptions: typescript.CompilerOptions = {
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    strict: true,
    noEmitOnError: false,
    lib: ['esnext'],
    allowJs: true,
    skipLibCheck: true,
    strictNullChecks: false,
    noEmit: true,
    esModuleInterop: true,
    moduleResolution: typescript.ModuleResolutionKind.Bundler,
    resolveJsonModule: true,
    isolatedModules: true,
    noImplicitAny: false,
    incremental: true,
    typeRoots: [path.join(process.cwd(), 'node_modules', '@types')],
    types: ['node'],
    paths: {
      dayjs: [dayjsFileName],
    },
  };

  const fileMap = {
    [entryFileName]: tsCode.entry,
    [globalEntryFileName]: createGlobalEntryCode(),
    [dayjsFileName]: fs.readFileSync(`${process.cwd()}/node_modules/dayjs/index.d.ts`, 'utf-8'),
  };
  const fileNames = Object.keys(fileMap);
  const languageService = typescript.createLanguageService(
    {
      getScriptFileNames: () => fileNames,
      getScriptVersion: () => '1',
      getScriptSnapshot: (name) => {
        if (name in fileMap) {
          return typescript.ScriptSnapshot.fromString(fileMap[name]);
        }
        if (fs.existsSync(name)) {
          return typescript.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf-8'));
        }
        return undefined;
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: (options) => {
        const fileName = typescript.getDefaultLibFilePath(options);
        return fileName;
      },
      fileExists: (fileName) => fileMap[fileName] !== undefined || fs.existsSync(fileName),
      readFile: (fileName) => {
        if (fileMap[fileName]) {
          return fileMap[fileName];
        }
        try {
          const file = fs.readFileSync(fileName, 'utf-8');
          return file;
        } catch {
          return undefined;
        }
      },
      readDirectory: (path, extensions) => extensions?.map((ext) => `${path}/file${ext}`) || [],
      directoryExists: () => true,
      getDirectories: () => [],
    },
    typescript.createDocumentRegistry()
  );

  const syntaxDiagnostics = languageService.getSyntacticDiagnostics(entryFileName);
  const semanticDiagnostics = languageService.getSemanticDiagnostics(entryFileName);
  const diagnostics = [...syntaxDiagnostics, ...semanticDiagnostics];

  const errors = diagnostics.map((diagnostic) => {
    if (diagnostic.file) {
      const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      return {
        line: line + 1,
        column: character + 1,
        msg: message,
        code: diagnostic.code,
      };
    }
    return {
      message: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      code: diagnostic.code,
    };
  });
  if (errors.length) {
    return {
      typescriptErrors: errors,
      repairDiagnostics: [...unifyStaticDiagnostics('typescript', errors),
        ...(state.semanticContractPlan ? [repairGuardDiagnostic('PLANNING_REVIEW_REQUIRED', 'Review program-owned TypeScript failure; fixed semantics cannot be freely rewritten.')] : [])],
    };
  } else {
    return {
      typescript: state.typescript,
      contract: state.contract,
      typescriptErrors: [],
      repairDiagnostics: [],
    };
  }
};

const developmentValidationNode = async (state: typeof StateAnnotation.State) => {
  assertReadOnlyInput(state);
  try {
    const report = await evaluateDevelopmentBehavior(
      state.typescript.entry,
      state.developmentRequirement,
      {project: state.project, useCase: state.useCase, operation: state.operation}
    );
    assertReadOnlyInput(state);
    return {
      developmentValidation: {...report, dynamicRepairEnabled: true},
      developmentInfrastructureError: null,
      repairDiagnostics: developmentRepairDiagnostics(
        report,
        state.modelGroundingContext,
        state.ocl
      ).concat(state.semanticContractPlan && !report.passed ? [repairGuardDiagnostic('PLANNING_REVIEW_REQUIRED', 'The program-owned semantics failed development behavior checks. Review the planner or source alignment; do not ask the model to change the fixed goal.')] : []),
      repairProtocol: state.repairProtocol,
    };
  } catch (error) {
    assertReadOnlyInput(state);
    const msg = error instanceof Error ? error.message : String(error);
    return {
      developmentValidation: null,
      developmentInfrastructureError: msg,
      repairDiagnostics: [
        {
          stage: 'development',
          classification: classifyRepairDiagnostic('development', 'DEVELOPMENT_RUNNER_ERROR'),
          category: 'execution',
          code: 'DEVELOPMENT_RUNNER_ERROR',
          msg,
          repairEligible: false,
          obligationIds: [],
          ruleIds: [],
          modelEvidence: [],
          location: {resolution: 'unknown'},
          repair:
            'Inspect the development runner; do not change business conditions to hide an infrastructure failure.',
        } satisfies RepairDiagnostic,
      ],
      repairProtocol: state.repairProtocol,
    };
  }
};

const testResultNode = async (state: typeof StateAnnotation.State) => {
  assertReadOnlyInput(state);
  const {project: key, useCase: uc, operation: op} = state;
  const p = project[key];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const serviceName = service.name;
  const operationName = operation.name;
  const testDir = path.resolve(process.cwd(), 'test');
  const folder = path.resolve(testDir, 'tmp');
  fs.ensureDirSync(folder);
  const fileName = `${key}${serviceName}${operationName}${randomUUID().replaceAll('-', '')}`;
  const testFileName = `${fileName}.test.ts`;
  const testFilePath = path.resolve(folder, testFileName);
  const filePath = path.resolve(folder, `${fileName}.ts`);
  const originTestFilePath = historicalOraclePath(
    state.oracleProfile,
    key,
    uc,
    op,
    path.resolve(testDir, `${key}-${serviceName}-${operationName}/index.test.ts`)
  );
  const originTestFileAst = babel.parse(fs.readFileSync(originTestFilePath, 'utf-8'), {
    filename: 'test.ts',
    presets: [presetTypescript],
  })!;
  babel.traverse(originTestFileAst, {
    enter(path) {
      if (path.isStringLiteral({value: './entry'})) {
        path.node.value = `./${fileName}`;
      }
      if (path.isIdentifier({name: serviceName})) {
        path.node.name = `${serviceName}_AutoGenerated`;
      }
    },
  });
  fs.writeFileSync(testFilePath, generate(originTestFileAst).code, 'utf-8');
  const boundarySource = boundaryOraclePath(state.oracleProfile, key, uc, op);
  const boundaryTestFileName = `${fileName}.boundary.test.ts`;
  const boundaryTestFilePath = path.resolve(folder, boundaryTestFileName);
  if (boundarySource) {
    writeCandidateBoundaryOracle({
      source: boundarySource,
      output: boundaryTestFilePath,
      candidateModule: `./${fileName}`,
      serviceName,
    });
  }
  const runtime = await createIsolatedTestRuntime();
  try {
    fs.writeFileSync(filePath, buildEntryCode({service: state.typescript!.originalService,
      entity: state.typescript!.originalEntity, runtimeModule: `./${path.basename(runtime.path, '.ts')}`}));
    const res = await jestRunner.runCLI(
      {
        _: [
          `test/tmp/${testFileName}`,
          ...(boundarySource ? [`test/tmp/${boundaryTestFileName}`] : []),
        ],
        $0: '',
        json: false,
        coverage: true,
        runTestsByPath: true,
        config: runtime.config,
      },
      [process.cwd()]
    );
    const summary = res.results.coverageMap!.getCoverageSummary();
    const tests = res.results.testResults;
    if (tests.length !== (boundarySource ? 2 : 1)) {
      throw new Error(
        `Expected ${boundarySource ? 2 : 1} oracle suite(s), received ${tests.length}`
      );
    }
    const result = summarizeJestResults(res.results, boundarySource ? 2 : 1);
    assertReadOnlyInput(state);
    return {
      typescript: state.typescript,
      contract: state.contract,
      summary,
      result,
      methodAccepted:
        result.success &&
        (!state.developmentBehavior || state.developmentValidation?.passed === true),
      repairProtocol: state.repairProtocol,
    };
  } finally {
    runtime.dispose();
    fs.removeSync(testFilePath);
    if (boundarySource) fs.removeSync(boundaryTestFilePath);
    fs.removeSync(filePath);
  }
};

const generationEntryNode = async (state: typeof StateAnnotation.State) => ({
  repairProtocol: state.repairProtocol,
  ...(state.developmentBehavior || state.generationTaskPlan || state.semanticContractPlan || state.constraintTaskPlan
    ? {readOnlyRepairEvidence: state.readOnlyRepairEvidence}
    : {}),
  ...(state.generationTaskPlan
    ? {generationTaskPlan: state.generationTaskPlan, inputMetadata: state.inputMetadata}
    : {}),
  ...(state.semanticContractPlan ? {semanticContractPlan: state.semanticContractPlan, inputMetadata: state.inputMetadata} : {}),
  ...(state.constraintTaskPlan ? {constraintTaskPlan: state.constraintTaskPlan, inputMetadata: state.inputMetadata} : {}),
  ...(state.constraintRepairControl ? {constraintRepairControl: state.constraintRepairControl} : {}),
});

const builder = new StateGraph(StateAnnotation)
  .addNode('Generation Entry', generationEntryNode)
  .addNode('OCL Generator', oclGeneratorNode)
  .addNode('Contract Generator', contractGeneratorNode)
  .addNode('TypeScript Generator', typescriptGeneratorNode)
  .addNode('TypeScript Parser', typescriptParserNode)
  .addNode('Development Validation', developmentValidationNode)
  .addNode('Test Result', testResultNode)
  .addEdge('__start__', 'Generation Entry')
  .addConditionalEdges(
    'Generation Entry',
    (state: typeof StateAnnotation.State) => routeGenerationEntry(Boolean(state.ocl)),
    {
      seeded: 'Contract Generator',
      generate: 'OCL Generator',
    }
  )
  .addEdge('OCL Generator', 'Contract Generator')
  .addConditionalEdges(
    'Contract Generator',
    (state: typeof StateAnnotation.State) => {
      return routeAfterValidation(
        state.contractErrors?.length > 0,
        state.generationCount,
        state.maxGenerationAttempts,
        state.repairDiagnostics ?? []
      );
    },
    {
      next: 'TypeScript Generator',
      retry: 'OCL Generator',
      exhausted: '__end__',
      blocked: '__end__',
    }
  )
  .addConditionalEdges(
    'TypeScript Generator',
    (state: typeof StateAnnotation.State) => {
      return routeAfterValidation(
        state.typescriptErrors?.length > 0,
        state.generationCount,
        state.maxGenerationAttempts,
        state.repairDiagnostics ?? []
      );
    },
    {
      next: 'TypeScript Parser',
      retry: 'OCL Generator',
      exhausted: '__end__',
      blocked: '__end__',
    }
  )
  .addConditionalEdges(
    'TypeScript Parser',
    (state: typeof StateAnnotation.State) => {
      const route = routeAfterValidation(
        state.typescriptErrors?.length > 0,
        state.generationCount,
        state.maxGenerationAttempts,
        state.repairDiagnostics ?? []
      );
      return route === 'next' && state.developmentBehavior ? 'development' : route;
    },
    {
      next: 'Test Result',
      development: 'Development Validation',
      retry: 'OCL Generator',
      exhausted: '__end__',
      blocked: '__end__',
    }
  )
  .addConditionalEdges(
    'Development Validation',
    (state: typeof StateAnnotation.State) =>
      routeAfterDevelopment(
        state.developmentValidation ?? {passed: false},
        state.repairDiagnostics ?? [],
        state.generationCount,
        state.maxGenerationAttempts ?? 5
      ),
    {retry: 'OCL Generator', evaluate: 'Test Result'}
  )
  .addEdge('Test Result', '__end__');

export const graph = builder.compile();
