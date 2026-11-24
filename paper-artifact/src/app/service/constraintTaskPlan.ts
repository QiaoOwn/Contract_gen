import {createHash} from 'node:crypto';
import policy from '../../../config/constraint-solving-policy.json';
import type {OperationModelGrounding} from './operationModelGrounding';
import {modelDeclarations} from './modelDeclarations';
import {analyzeRepairCandidate, type RepairCandidate} from './repairLocalization';
import {generateContractCode, parse} from '../util';
import type {RepairDiagnostic} from './repairDiagnostics';
import {classifyRepairDiagnostic} from './repairTaxonomy';
import {matchConstraintEvidence, type ConstraintEvidenceMatch} from './constraintEvidence';
import {repairGuardDiagnostic} from './repairGuards';
import {createModelGroundingRules, renderModelGroundingRules} from './modelGroundingRules';
import {verifyNarrativeGenerationIdentity, type NarrativeGenerationIdentity} from './narrativeRequestIdentity';

export const CONSTRAINT_TASK_VERSION = 'constraint-task-planning-v1';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
type Clause = 'precondition' | 'postcondition';
export type ConstraintTask = {
  id: string;
  clause: Clause;
  requirement: string;
  requirementLine: number;
  modelHints: {id: string; name: string}[];
  bindingBasis: 'literal-model-name-mentions-not-semantic-resolution';
};
export type ConstraintTaskPlan = {
  version: typeof CONSTRAINT_TASK_VERSION;
  operationId: string;
  requirementHash: string;
  modelRulesHash: string;
  policyHash: string;
  intent: string;
  tasks: ConstraintTask[];
  declarations: ReturnType<typeof modelDeclarations>;
  rules: typeof policy.rules;
  hash: string;
};
export type TaskEvidence = {taskId: string; expression: string};
export type TaskSolutionIssue = {code: string; message: string; taskId?: string; clause?: Clause};

// Compile task boundaries and declaration visibility, never a target OCL expression.
export function createConstraintTaskPlan(
  requirement: string,
  context: OperationModelGrounding
): ConstraintTaskPlan {
  let section: 'intent' | Clause | undefined;
  const seen = new Set<string>();
  const intent: string[] = [];
  const tasks: ConstraintTask[] = [];
  const counts = {precondition: 0, postcondition: 0};
  const declarations = modelDeclarations(context.index);
  for (const [offset, raw] of requirement.split(/\r?\n/).entries()) {
    const text = raw.trim();
    if (!text) continue;
    const header = /^(Operation intent|Preconditions|Postconditions):$/i.exec(text);
    if (header) {
      section = /^Operation/i.test(text)
        ? 'intent'
        : /^Pre/i.test(text)
          ? 'precondition'
          : 'postcondition';
      if (seen.has(section)) throw new Error(`Duplicate requirement section: ${section}`);
      seen.add(section);
      continue;
    }
    if (section === 'intent') {
      intent.push(text);
      continue;
    }
    const bullet = /^-\s+(.+)$/.exec(text);
    if (!section || !bullet) throw new Error(`Unsupported task layout at line ${offset + 1}`);
    const words = new Set(bullet[1].toLowerCase().match(/[a-z_]\w*/g) ?? []);
    tasks.push({
      id: `${context.index.operation.id}/constraint-task/${section === 'precondition' ? 'P' : 'Q'}${++counts[section]}`,
      clause: section,
      requirement: bullet[1],
      requirementLine: offset + 1,
      modelHints: declarations
        .filter((item) => words.has(item.name.split('.').at(-1)!.toLowerCase()))
        .map(({id, name}) => ({id, name})),
      bindingBasis: 'literal-model-name-mentions-not-semantic-resolution',
    });
  }
  if (seen.size !== 3 || !intent.length || !counts.precondition || !counts.postcondition)
    throw new Error('Task solving requires intent and explicit pre/post requirement bullets');
  if (tasks.length > 256) throw new Error('Too many requirement tasks');
  const payload: Omit<ConstraintTaskPlan, 'hash'> = {
    version: CONSTRAINT_TASK_VERSION,
    operationId: context.index.operation.id,
    requirementHash: createHash('sha256').update(requirement).digest('hex'),
    modelRulesHash: context.rules.rulesHash,
    policyHash: digest(policy),
    intent: intent.join('\n'),
    tasks,
    declarations,
    rules: structuredClone(policy.rules),
  };
  return {...payload, hash: digest(payload)};
}

export function assertConstraintTaskPlan(
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding,
  requirement?: string
) {
  const {hash, ...payload} = plan;
  if (
    hash !== digest(payload) ||
    plan.operationId !== context.index.operation.id ||
    plan.modelRulesHash !== context.rules.rulesHash ||
    plan.policyHash !== digest(policy) ||
    plan.version !== CONSTRAINT_TASK_VERSION ||
    digest(plan.rules) !== digest(policy.rules) ||
    digest(plan.declarations) !== digest(modelDeclarations(context.index))
  )
    throw new Error('Constraint task plan integrity or model identity mismatch');
  if (requirement !== undefined && createConstraintTaskPlan(requirement, context).hash !== hash)
    throw new Error('Constraint task plan differs from the original requirement compilation');
}

export const renderConstraintTaskPlan = (plan: ConstraintTaskPlan) =>
  [
    `Program-issued constraint tasks: ${plan.version}; hash ${plan.hash}`,
    'The program fixes task identities, clause ownership, model declarations and acceptance rules. You solve the OCL expressions. No target expressions or reference contract are supplied.',
    'modelHints are literal name matches only, not mandatory references or an established business interpretation. Resolve meaning from the complete requirement and model; never invent an association or effect.',
    `Operation intent: ${plan.intent}`,
    ...plan.rules.map((rule) => `${rule.id}: ${rule.meaning}`),
    ...plan.tasks.map((task) => JSON.stringify(task)),
    'All visible declarations (local helpers must be justified and type compatible):',
    ...plan.declarations.map((declaration) => JSON.stringify(declaration)),
  ].join('\n');

export const CONSTRAINT_PREFLIGHT_VERSION = 'constraint-generation-preflight-v1';

// Authorize a request from program-owned inputs, independently of the model's response.
export function prepareConstraintGeneration(param: {
  plan: ConstraintTaskPlan;
  context: OperationModelGrounding;
  requirement: string;
  input: string;
  inputHash: string;
  narrativeIdentity?: NarrativeGenerationIdentity;
}) {
  const {plan, context, requirement, input} = param;
  const compiledRules = createModelGroundingRules(context.index);
  if (digest(compiledRules) !== digest(context.rules))
    throw new Error('Generation preflight: model rule pack differs from current declarations');
  if (param.narrativeIdentity) return verifyNarrativeGenerationIdentity({...param, narrativeIdentity: param.narrativeIdentity});
  assertConstraintTaskPlan(plan, context, requirement);
  const inputHash = createHash('sha256').update(input).digest('hex');
  const operation = context.index.operation;
  const signature = `${operation.name}(${operation.parameters
    .map(parameter => `${parameter.name}: ${parameter.type.raw}`).join(', ')})${
    operation.returnType ? `: ${operation.returnType.type.raw.trim()}` : ''}`;
  if (
    inputHash !== param.inputHash ||
    !input.includes(`\nService: ${operation.service}\nOperation: ${operation.name}\nSignature: ${signature}\n\nStructured natural-language requirement:\n${requirement}\n\n`) ||
    !input.includes(`\n\n${renderModelGroundingRules(compiledRules)}\n\n`) ||
    !input.endsWith(`\n\n${renderConstraintTaskPlan(plan)}`)
  )
    throw new Error('Generation preflight: request input differs from the authorized task and model input');
  return {
    version: CONSTRAINT_PREFLIGHT_VERSION,
    ready: true,
    planHash: plan.hash,
    inputHash,
    requirementHash: plan.requirementHash,
    modelIndexHash: digest(context.index),
    modelRulesHash: compiledRules.rulesHash,
    taskCompilationVerified: true,
    modelRuleCompilationVerified: true,
    taskCount: plan.tasks.length,
    allApplicableModelRuleIds: compiledRules.rules.map(rule => rule.id),
    taskPreparation: plan.tasks.map(task => {
      const hints = new Set(task.modelHints.map(hint => hint.id));
      return {
        taskId: task.id,
        requirementLine: task.requirementLine,
        clause: task.clause,
        policyRuleIds: plan.rules.map(rule => rule.id),
        modelHints: task.modelHints,
        hintedModelRuleIds: compiledRules.rules
          .filter(rule => rule.family !== 'MG-01' && rule.modelElementIds.some(id => hints.has(id)))
          .map(rule => rule.id),
        bindingStatus: task.modelHints.length ? 'lexical-candidates-only' : 'requires-model-resolution',
      };
    }),
    hintSemantics: 'Lexical candidates guide inspection; all model rules still apply. Hints neither require a reference nor establish business meaning.',
    ownership: 'program-owns-tasks-and-acceptance-model-solves-expressions',
    semanticStatus: 'requires-candidate-and-behavioral-evaluation',
  } as const;
}

export function auditTaskEvidence(
  plan: ConstraintTaskPlan,
  ocl: RepairCandidate,
  evidence: TaskEvidence[],
  context: OperationModelGrounding
) {
  assertConstraintTaskPlan(plan, context);
  const issues: TaskSolutionIssue[] = [];
  const seen = new Map<string, Set<string>>();
  const analysis = analyzeRepairCandidate(ocl, context);
  const candidate = analysis ? parse(analysis.contract).tree : undefined;
  const linkedTasks: {taskId: string; clause: Clause; matches: ConstraintEvidenceMatch[]}[] = [];
  for (const item of evidence) {
    const task = plan.tasks.find((task) => task.id === item.taskId);
    const expressions = seen.get(item.taskId);
    if (!task || expressions?.has(item.expression) || (expressions?.size ?? 0) >= 8) {
      issues.push({
        code: 'TASK_SCOPE',
        taskId: item.taskId,
        message: 'Unknown, duplicate, or excessive task evidence.',
      });
      continue;
    }
    if (expressions) expressions.add(item.expression);
    else seen.set(item.taskId, new Set([item.expression]));
    if (!analysis) continue; // Parser diagnostics remain the authoritative syntax feedback.
    const op = context.index.operation;
    const anchor = parse(
      generateContractCode({
        serviceName: op.service,
        operationName: op.name,
        parameters: op.parameters.map((parameter) => ({
          name: parameter.name,
          type: parameter.type.raw,
        })),
        returnedType: op.returnType?.type.raw,
        ...ocl,
        [task.clause]: item.expression,
      })
    );
    const node =
      task.clause === 'precondition'
        ? anchor.tree?.rulePrecondition().ruleOCLExpressionCS()
        : anchor.tree?.rulePostcondition().ruleOCLExpressionCS();
    const root =
      task.clause === 'precondition'
        ? candidate?.rulePrecondition().ruleOCLExpressionCS()
        : candidate?.rulePostcondition().ruleOCLExpressionCS();
    const matches =
      !anchor.errors.length && node && root ? matchConstraintEvidence(root, node) : [];
    if (matches.length) linkedTasks.push({taskId: task.id, clause: task.clause, matches});
    else
      issues.push({
        code: 'TASK_EVIDENCE_NOT_FOUND',
        taskId: task.id,
        clause: task.clause,
        message:
          `Submitted evidence ${JSON.stringify(item.expression.slice(0, 240))} is not an actual AST subtree or contiguous same-operator Boolean segment in one binding scope and branch of ${task.clause}. For separate effects, submit separate entries with the same taskId. Keep an otherwise valid contract unchanged.`,
      });
  }
  for (const task of plan.tasks)
    if (!seen.has(task.id))
      issues.push({
        code: 'TASK_EVIDENCE_MISSING',
        taskId: task.id,
        clause: task.clause,
        message: `Missing candidate expression evidence for requirement line ${task.requirementLine}.`,
      });
  return {
    planHash: plan.hash,
    structuralTraceability: issues.length ? 'incomplete' : analysis ? 'linked' : 'unresolved',
    semanticStatus: 'requires-behavioral-evaluation' as const,
    linkedTasks,
    issues,
  };
}

export function taskSolutionDiagnostics(
  plan: ConstraintTaskPlan,
  issues: TaskSolutionIssue[]
): RepairDiagnostic[] {
  return issues.map((issue) => {
    if (issue.code === 'TASK_REPAIR_SCOPE')
      return repairGuardDiagnostic('REPAIR_SCOPE_VIOLATION', issue.message);
    const task = plan.tasks.find((task) => task.id === issue.taskId);
    return {
      stage: 'model',
      classification: classifyRepairDiagnostic('model', issue.code, {modelRule: true}),
      category: 'model-structure',
      code: issue.code,
      msg: issue.message,
      repairEligible: issue.code !== 'TASK_EVIDENCE_UNCHANGED',
      obligationIds: task ? [task.id] : [],
      ruleIds: ['CT-01', 'CT-06'],
      modelEvidence: [],
      location: {
        resolution: task ? 'clause-only' : 'unknown',
        ...(task ? {clause: task.clause} : {}),
      },
      repair: task
        ? issue.code.startsWith('TASK_EVIDENCE')
          ? `Keep the contract unchanged when only evidence is wrong. Link one or more actual expressions from ${task.clause} to this task; use separate entries for nonadjacent effects. Requirement: ${task.requirement}`
          : `Implement the unchanged requirement and link an actual candidate expression: ${task.requirement}`
        : 'Return only the issued task IDs and the required contract envelope; do not redefine the plan.',
    };
  });
}
