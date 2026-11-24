import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {ParserRuleContext} from 'antlr4';
import {z} from 'zod';
import {RuleAtomicExpressionContext} from '../../../antlr4/REMODELParser';
import type {OpenAIChatModelId} from '@langchain/openai';
import type {ProjectParam} from '../type';
import {generateContractCode, parse} from '../util';
import {buildOperationInput} from './createOperationInput';
import {auditTaskEvidence, taskSolutionDiagnostics} from './constraintTaskPlan';
import {
  taskSolutionSchema,
  createConstraintSolvingSystemPrompt,
  CONSTRAINT_SOLVER_PROMPT_VERSION,
} from './constraintSolving';
import {createEntryCode} from './createEntryCode';
import {parseTypescriptEntry} from './parseTypescriptEntry';
import {validateGeneratedContractSemantics} from './validateGeneratedContractSemantics';
import {validateModelGroundedContract} from './validateModelGroundedContract';
import {evaluateDevelopmentBehavior} from './developmentBehavior/evaluateDevelopmentBehavior';
import {developmentRegistry, verifyDevelopmentSources} from './developmentBehavior/registry';
import {
  createRepairProtocol,
  developmentRepairDiagnostics,
} from './developmentBehavior/developmentRepair';
import {captureReadOnlyRepairEvidence, assertReadOnlyRepairEvidence} from './repairIntegrity';
import {unifyStaticDiagnostics} from './repairDiagnostics';
import {graph} from './graph';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const CONTROL_KINDS = [
  'evidence-missing',
  'syntax-precondition',
  'boolean-result-false',
] as const;
export const constraintControlSchema = z
  .object({
    project: z.string().min(1),
    useCase: z.string().min(1),
    operation: z.string().min(1),
    model: z.string().min(1),
    apiKey: z.string().min(1),
    userInput: z.string().min(1),
    maxGenerationAttempts: z.literal(5),
    controlKind: z.enum(CONTROL_KINDS),
    sourceSolution: taskSolutionSchema,
    expectedRuntimeHash: z.string().regex(/^[a-f0-9]{64}$/),
    expectedOracleLockHash: z.string().regex(/^[a-f0-9]{64}$/),
    oracleProfile: z.enum(['lab-adjudicated-114-v1', 'rm2pt-authoritative-preparation-v4']).default('lab-adjudicated-114-v1'),
  })
  .strict();
export type ConstraintControlRequest = z.infer<typeof constraintControlSchema>;
export type ConstraintControlRecord = {
  version: 'constraint-repair-control-v1';
  role: 'synthetic-functional-control';
  controlKind: (typeof CONTROL_KINDS)[number];
  planHash: string;
  sourceSolutionHash: string;
  seedSolutionHash: string;
  syntheticSeedSlots: 1;
  syntheticSeedLlmCalls: 0;
  maxRealRepairCalls: 4;
  hiddenFeedbackAllowed: false;
  expectedCode: string;
  baselineDevelopmentPassed: true;
  expectedSeedDetected: true;
  oracleLockHash: string;
  targetObligationIds: string[];
};

export async function prepareConstraintRepairControl(request: ConstraintControlRequest) {
  const checked = constraintControlSchema.parse(request);
  if (createRepairProtocol(true).fingerprint !== checked.expectedRuntimeHash)
    throw new Error(
      'Server runtime differs from the control preflight; restart before making model calls'
    );
  const isV4 = checked.oracleProfile === 'rm2pt-authoritative-preparation-v4';
  const lockPath = isV4
    ? 'data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json'
    : 'data/benchmark/lab_adjudicated_114_v1/oracle-suite-lock.json';
  const lockBytes = fs.readFileSync(lockPath);
  if (hash(lockBytes.toString('utf8')) !== checked.expectedOracleLockHash)
    throw new Error('Oracle lock identity differs from preflight');
  const lock = JSON.parse(lockBytes.toString('utf8'));
  if (!isV4 && (
    lock.operation_count !== 114 ||
    hash(fs.readFileSync('data/benchmark/lab_adjudicated_114_v1/oracle-map.jsonl', 'utf8')) !==
      lock.oracle_map_sha256
  ))
    throw new Error('Oracle map identity differs from the frozen lock');
  const v4Input = 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl';
  const v4Record = isV4 ? (lock.records as {id: string; historical_jest: string; boundary_jest: string | null; jest_sha256: string; source_path: string; source_sha256: string}[])
    .find((item) => item.id === `${checked.project}_${checked.useCase}_${checked.operation}`) : undefined;
  if (isV4 && (lock.version !== 'rm2pt-authoritative-oracle-preparation-v4' ||
    lock.input !== v4Input || lock.operation_count !== 114 ||
    lock.prepared_operation_count !== 114 || !v4Record ||
    hash(fs.readFileSync(v4Input, 'utf8')) !== lock.input_sha256))
    throw new Error('v4 input or Oracle preparation identity differs from the frozen manifest');
  const sourceFiles: {path: string; sha256: string}[] = isV4 ? [
    {path: v4Input, sha256: lock.input_sha256},
    {path: v4Record!.source_path, sha256: v4Record!.source_sha256},
    {path: v4Record!.historical_jest, sha256: v4Record!.jest_sha256},
    ...(v4Record!.boundary_jest ? [{path: v4Record!.boundary_jest, sha256: hash(fs.readFileSync(v4Record!.boundary_jest, 'utf8'))}] : []),
  ] : lock.files as {path: string; sha256: string}[];
  const oracleSources = sourceFiles.map((file, index) => {
    const relative = path.relative(process.cwd(), path.resolve(file.path));
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      createHash('sha256').update(fs.readFileSync(file.path)).digest('hex') !== file.sha256
    )
      throw new Error('Oracle source changed or is outside the project');
    return {
      id: `control-oracle-${index}`,
      path: file.path,
      sha256: file.sha256,
      note: 'Evaluation-only hash guard, never sent as a model instruction.',
    };
  });
  oracleSources.push({
    id: 'control-oracle-lock',
    path: lockPath,
    sha256: checked.expectedOracleLockHash,
    note: 'Frozen Oracle identity.',
  });
  if (!isV4) oracleSources.push({
    id: 'control-oracle-map',
    path: 'data/benchmark/lab_adjudicated_114_v1/oracle-map.jsonl',
    sha256: lock.oracle_map_sha256,
    note: 'Frozen evaluation-only operation-to-test mapping.',
  });
  const settings = {
    project: checked.project,
    useCase: checked.useCase,
    operation: checked.operation,
  } as ProjectParam & {operation: string};
  const registration = developmentRegistry.require(settings);
  verifyDevelopmentSources(registration);
  const input = buildOperationInput({
    ...settings,
    userInput: checked.userInput,
    constraintSolving: true,
  });
  const plan = input.constraintTaskPlan!;
  if (checked.sourceSolution.planHash !== plan.hash)
    throw new Error('Source solution belongs to a different task plan');
  const original = {
    ...checked.sourceSolution.contract,
    definition: checked.sourceSolution.contract.definition ?? '',
  };
  const sourceAudit = auditTaskEvidence(
    plan,
    original,
    checked.sourceSolution.taskEvidence,
    input.modelGroundingContext
  );
  if (sourceAudit.issues.length || sourceAudit.structuralTraceability !== 'linked')
    throw new Error('Source task evidence must be valid');
  const op = input.modelGroundingContext.index.operation;
  const assemble = (ocl: typeof original) =>
    generateContractCode({
      serviceName: op.service,
      operationName: op.name,
      parameters: op.parameters.map((parameter) => ({
        name: parameter.name,
        type: parameter.type.raw,
      })),
      returnedType: op.returnType?.type.raw,
      ...ocl,
    });
  const parsed = parse(assemble(original));
  if (!parsed.tree || parsed.errors.length) throw new Error('Source contract must parse');
  const validation = validateModelGroundedContract({
    tree: parsed.tree,
    context: input.modelGroundingContext,
  });
  if (
    validation.diagnostics.length ||
    validateGeneratedContractSemantics({tree: parsed.tree, hasReturnValue: Boolean(op.returnType)})
      .length
  )
    throw new Error('Source contract failed subset or model validation');
  const sourceCode = await createEntryCode({...settings, ocl: original});
  if (parseTypescriptEntry(sourceCode.entry).length)
    throw new Error('Source contract failed TypeScript checking');
  const baseline = await evaluateDevelopmentBehavior(sourceCode.entry, input.requirement, settings);
  if (!baseline.passed) throw new Error('Source contract must pass current development behavior');
  const seed = structuredClone(checked.sourceSolution);
  seed.contract.definition = original.definition;
  let expectedCode: string;
  let targetObligationIds: string[] = [];
  if (checked.controlKind === 'evidence-missing') {
    const task = plan.tasks.find((task) => task.clause === 'postcondition')!;
    seed.taskEvidence = seed.taskEvidence.filter((item) => item.taskId !== task.id);
    expectedCode = 'TASK_EVIDENCE_MISSING';
    targetObligationIds = [task.id];
  } else if (checked.controlKind === 'syntax-precondition') {
    seed.contract.precondition = `(${original.precondition}) and true`;
    expectedCode = 'PARSER';
  } else {
    if (op.returnType?.type.raw !== 'Boolean')
      throw new Error('Boolean-result control requires a Boolean return type');
    const body = parsed.tree.rulePostcondition().ruleOCLExpressionCS();
    const hits: ParserRuleContext[] = [];
    const walk = (node: ParserRuleContext) => {
      if (
        node instanceof RuleAtomicExpressionContext &&
        node.ruleLeftSubAtomicExpression().getText() === 'result' &&
        node.ruleInfixCompareOperatorName()?.getText() === '=' &&
        node.ruleRightSubAtomicExpression()?.getText() === 'true'
      )
        hits.push(node.ruleRightSubAtomicExpression());
      for (const child of node.children ?? []) if (child instanceof ParserRuleContext) walk(child);
    };
    walk(body);
    if (hits.length !== 1)
      throw new Error('Expected exactly one AST-located result = true mutation target');
    const code = assemble(original);
    const start = body.start.start,
      end = body.stop!.stop + 1;
    const target = hits[0];
    const replace = (text: string) =>
      text.slice(0, target.start.start - start) +
      'false' +
      text.slice(target.stop!.stop + 1 - start);
    seed.contract.postcondition = replace(code.slice(start, end));
    // Re-link evidence to the changed clause, without injecting an extra protocol error.
    seed.taskEvidence = seed.taskEvidence.map((item) =>
      plan.tasks.find((task) => task.id === item.taskId)?.clause === 'postcondition'
        ? {...item, expression: seed.contract.postcondition}
        : item
    );
    expectedCode = 'OBLIGATION_MISMATCH';
    targetObligationIds = registration.obligations
      .filter(
        (obligation) =>
          obligation.clause === 'postcondition' && obligation.modelFeatures.includes('$result')
      )
      .map((obligation) => obligation.id);
    if (!targetObligationIds.length)
      throw new Error('No source-linked result obligation is registered for this control');
  }
  const ocl = {...seed.contract, definition: seed.contract.definition ?? ''};
  const evidence = auditTaskEvidence(plan, ocl, seed.taskEvidence, input.modelGroundingContext);
  const seedParsed = parse(assemble(ocl));
  let report: typeof baseline | null = null;
  let diagnostics = seedParsed.errors.length
    ? unifyStaticDiagnostics('parser', seedParsed.errors)
    : taskSolutionDiagnostics(plan, evidence.issues);
  if (!diagnostics.length) {
    const seedValidation = validateModelGroundedContract({
      tree: seedParsed.tree!,
      context: input.modelGroundingContext,
    });
    if (
      seedValidation.diagnostics.length ||
      validateGeneratedContractSemantics({
        tree: seedParsed.tree!,
        hasReturnValue: Boolean(op.returnType),
      }).length
    )
      throw new Error('Behavior control unexpectedly failed static model or subset checks');
    const code = await createEntryCode({...settings, ocl});
    if (parseTypescriptEntry(code.entry).length)
      throw new Error('Behavior control unexpectedly failed TypeScript checks');
    report = await evaluateDevelopmentBehavior(code.entry, input.requirement, settings);
    diagnostics = developmentRepairDiagnostics(report, input.modelGroundingContext, ocl);
  }
  if (
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === expectedCode &&
        (!targetObligationIds.length ||
          diagnostic.obligationIds.some((id) => targetObligationIds.includes(id)))
    ) ||
    diagnostics.some((diagnostic) => !diagnostic.repairEligible)
  )
    throw new Error(
      'Injected fault did not produce the expected repair-eligible diagnosis; no model call is allowed'
    );
  const control: ConstraintControlRecord = {
    version: 'constraint-repair-control-v1',
    role: 'synthetic-functional-control',
    controlKind: checked.controlKind,
    planHash: plan.hash,
    sourceSolutionHash: hash(JSON.stringify(checked.sourceSolution)),
    seedSolutionHash: hash(JSON.stringify(seed)),
    syntheticSeedSlots: 1,
    syntheticSeedLlmCalls: 0,
    maxRealRepairCalls: 4,
    hiddenFeedbackAllowed: false,
    expectedCode,
    baselineDevelopmentPassed: true,
    expectedSeedDetected: true,
    oracleLockHash: checked.expectedOracleLockHash,
    targetObligationIds,
  };
  return {
    input,
    settings,
    original,
    seed,
    ocl,
    control,
    evidence,
    baseline,
    report,
    diagnostics,
    oracleSources,
    repairProtocol: createRepairProtocol(true),
    solverPromptVersion: CONSTRAINT_SOLVER_PROMPT_VERSION,
    solverPromptHash: hash(createConstraintSolvingSystemPrompt()),
  };
}

export async function generateConstraintRepairControl(request: ConstraintControlRequest) {
  const prepared = await prepareConstraintRepairControl(request);
  const state = {
    ...prepared.settings,
    model: request.model as OpenAIChatModelId,
    apiKey: request.apiKey,
    developmentBehavior: true,
    developmentRequirement: prepared.input.requirement,
    feedbackMode: 'full' as const,
    oracleProfile: request.oracleProfile,
    maxGenerationAttempts: 5,
    generationCount: 1,
    ocl: prepared.ocl,
    constraintTaskPlan: prepared.input.constraintTaskPlan!,
    constraintRepairControl: prepared.control,
    taskSolutionIssues: prepared.evidence.issues,
    taskSolutionAudit: null,
    inputMetadata: prepared.input.metadata,
    modelGroundingContext: prepared.input.modelGroundingContext,
    generationTaskPlan: null,
    semanticContractPlan: null,
    repairProtocol: prepared.repairProtocol,
    messages: [{role: 'user', content: prepared.input.content}],
  };
  const snapshot = captureReadOnlyRepairEvidence(state, [
    ...developmentRegistry.require(prepared.settings).sources,
    ...prepared.oracleSources,
  ]);
  assertReadOnlyRepairEvidence(snapshot, state);
  return graph.stream({...state, readOnlyRepairEvidence: snapshot}, {recursionLimit: 40});
}
