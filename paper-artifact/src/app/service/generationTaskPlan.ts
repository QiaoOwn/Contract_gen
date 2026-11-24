import {createHash} from 'node:crypto';
import bindings from '../../../config/generation-task-bindings.json';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {ContractClause} from './modelRuleDiagnostics';
import {modelDeclarations} from './modelDeclarations';
import {
  analyzeRepairCandidate,
  localizeBehaviorRepair,
  type RepairCandidate,
} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';
import {classifyRepairDiagnostic} from './repairTaxonomy';

export const GENERATION_CONTROL_VERSION = 'program-directed-generation-v1';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
type Clause = Exclude<ContractClause, 'definition'>;
type Declaration = ReturnType<typeof modelDeclarations>[number];
export type GenerationTask = {
  id: string;
  clause: Clause;
  requirement: string;
  requirementLine: number;
  bindingStatus: 'explicit' | 'needs-binding';
  bindings: (Declaration & {role: 'context' | 'required-reference'})[];
  ruleIds: string[];
};
export type GenerationTaskPlan = {
  version: typeof GENERATION_CONTROL_VERSION;
  operationId: string;
  requirementHash: string;
  modelRulesHash: string;
  bindingCatalogVersion: string;
  intent: string;
  tasks: GenerationTask[];
  hash: string;
};

// Only split the supplied input. Never mine reference contracts or scenario expectations.
export function createGenerationTaskPlan(
  requirement: string,
  context: OperationModelGrounding
): GenerationTaskPlan {
  let section: 'intent' | Clause | undefined;
  const intent: string[] = [];
  const tasks: GenerationTask[] = [];
  const declarations = modelDeclarations(context.index);
  const key = [context.index.project, context.index.useCase, context.index.operation.name].join(
    '/'
  );
  const counts = {precondition: 0, postcondition: 0};
  const catalog = bindings.bindings.filter((item) => item.operation === key);
  const seen = new Set<string>();
  for (const [lineIndex, line] of requirement.split(/\r?\n/).entries()) {
    const text = line.trim();
    if (!text) continue;
    if (/^Operation intent:$/i.test(text)) {
      section = 'intent';
      continue;
    }
    if (/^Preconditions:$/i.test(text)) {
      section = 'precondition';
      continue;
    }
    if (/^Postconditions:$/i.test(text)) {
      section = 'postcondition';
      continue;
    }
    if (section === 'intent') {
      intent.push(text);
      continue;
    }
    const bullet = /^-\s+(.+)$/.exec(text);
    if (!section || !bullet)
      throw new Error(`Task plan requires explicit requirement bullets at line ${lineIndex + 1}`);
    const sourceText = bullet[1];
    const matching = catalog.filter(
      (item) => item.clause === section && item.requirement === sourceText
    );
    if (matching.length > 1) throw new Error('Duplicate generation task binding');
    const mapping = matching[0];
    const bound: GenerationTask['bindings'] = [];
    for (const role of ['context', 'required-reference'] as const) {
      for (const name of mapping?.[role === 'context' ? 'context' : 'requiredReferences'] ?? []) {
        const matches = declarations.filter((item) => item.name === name);
        if (!matches.length || matches.some((item) => !item.source))
          throw new Error(`Generation task binding has no source-backed declaration: ${name}`);
        // Identical service-state names can have multiple real declaration origins.
        bound.push(...matches.map((item) => ({...item, role})));
      }
    }
    if (mapping) seen.add(JSON.stringify([mapping.clause, mapping.requirement]));
    const ids = new Set(bound.map((item) => item.id));
    const featureIds = new Set(
      bound.filter((item) => item.name.includes('.')).map((item) => item.id)
    );
    tasks.push({
      id: `${context.index.operation.id}/task/${section === 'precondition' ? 'P' : 'Q'}${++counts[section]}`,
      clause: section,
      requirement: sourceText,
      requirementLine: lineIndex + 1,
      bindingStatus: mapping ? 'explicit' : 'needs-binding',
      bindings: bound,
      ruleIds: context.rules.rules
        .filter(
          (rule) =>
            rule.family !== 'MG-01' &&
            rule.modelElementIds.some((id) =>
              (rule.family === 'MG-02' || rule.family === 'MG-03' ? featureIds : ids).has(id)
            )
        )
        .map((rule) => rule.id),
    });
  }
  if (!intent.length || !counts.precondition || !counts.postcondition)
    throw new Error('Task plan requires intent, preconditions and postconditions');
  // A changed requirement must not silently retain an annotation for its former meaning.
  if (catalog.some((item) => !seen.has(JSON.stringify([item.clause, item.requirement]))))
    throw new Error(
      'Generation task bindings do not match the supplied requirement; review the binding catalog'
    );
  const payload: Omit<GenerationTaskPlan, 'hash'> = {
    version: GENERATION_CONTROL_VERSION,
    operationId: context.index.operation.id,
    requirementHash: hash(requirement),
    modelRulesHash: context.rules.rulesHash,
    bindingCatalogVersion: bindings.version,
    intent: intent.join('\n'),
    tasks,
  };
  return {...payload, hash: hash(JSON.stringify(payload))};
}

export function assertGenerationTaskPlan(
  plan: GenerationTaskPlan,
  context: OperationModelGrounding
) {
  const {hash: expected, ...payload} = plan;
  if (
    expected !== hash(JSON.stringify(payload)) ||
    plan.operationId !== context.index.operation.id ||
    plan.modelRulesHash !== context.rules.rulesHash
  )
    throw new Error('Generation task plan integrity or model identity mismatch');
}

export const renderGenerationTaskPlan = (plan: GenerationTaskPlan) =>
  [
    `Program-directed generation task plan: ${plan.version}; hash ${plan.hash}`,
    'The program fixes the requirements and declaration bindings. Generate only the complete definition/precondition/postcondition JSON; do not redefine the task, model, rules or tests.',
    'Definitions may provide justified bindings needed by the listed obligations. Preserve every requirement, including conditions and return obligations. Do not add business constraints merely because a model declaration exists.',
    'Required-reference checks establish structural traceability only, not behavioral correctness. Unbound tasks remain requirements to implement; their model correspondence is not program-established.',
    ...plan.tasks.flatMap((task) => [
      `[${task.id}] Target: ${task.clause}; input requirement line ${task.requirementLine}: ${task.requirement}`,
      `Binding status: ${task.bindingStatus}`,
      ...task.bindings.map((item) => `  ${item.role}: ${item.declaration} [${item.id}]`),
      `Applicable declaration-rule IDs: ${task.ruleIds.join(', ') || '(not explicitly bound)'}`,
    ]),
  ].join('\n');

export function auditGenerationTasks(
  plan: GenerationTaskPlan,
  candidate: RepairCandidate,
  context: OperationModelGrounding
) {
  assertGenerationTaskPlan(plan, context);
  const analysis = analyzeRepairCandidate(candidate, context);
  const complete = Boolean(analysis?.modelEvidenceComplete);
  const tasks = plan.tasks.map((task) => {
    const required = task.bindings.filter((item) => item.role === 'required-reference');
    const observed = required.filter((item) =>
      analysis?.evidence.references.some(
        (ref) => ref.clause === task.clause && ref.modelElementId === item.id
      )
    );
    return {
      taskId: task.id,
      clause: task.clause,
      status: !complete
        ? 'unresolved'
        : !required.length
          ? 'not-structurally-assessed'
          : observed.length === required.length
            ? 'references-observed'
            : 'required-reference-missing',
      missingModelElementIds: complete
        ? required.filter((item) => !observed.includes(item)).map((item) => item.id)
        : [],
      semanticStatus: 'not-proven' as const,
    };
  });
  const diagnostics: RepairDiagnostic[] = tasks.flatMap((result) => {
    if (result.status !== 'required-reference-missing') return [];
    const task = plan.tasks.find((item) => item.id === result.taskId)!;
    const region = analysis!.clauseRegions[task.clause]!;
    return [
      {
        stage: 'model' as const,
        classification: classifyRepairDiagnostic('model', 'TASK_REQUIRED_REFERENCE_MISSING', {
          modelRule: true,
          modelDeclaration: true,
        }),
        category: 'model-structure' as const,
        code: 'TASK_REQUIRED_REFERENCE_MISSING',
        msg: `Task ${task.id}: no direct indexed reference to ${task.bindings
          .filter((item) => result.missingModelElementIds.includes(item.id))
          .map((item) => item.name)
          .join(
            ', '
          )} in ${task.clause}. Review the requirement; missing-reference evidence does not prove a missing effect.`,
        repairEligible: true,
        obligationIds: [task.id],
        ruleIds: task.ruleIds,
        modelEvidence: task.bindings.map(({id, declaration, source}) => ({
          id,
          declaration,
          source,
        })),
        location: {
          resolution: 'clause-only' as const,
          clause: task.clause,
          line: region.line,
          column: region.column,
        },
        candidateScopes: [{clause: task.clause, expression: candidate[task.clause]}],
        localization: localizeBehaviorRepair(
          analysis,
          [
            {
              id: task.id,
              clause: task.clause,
              modelFeatures: [...new Set(task.bindings.map((item) => item.name))],
              localizationTargets: [
                ...new Set(
                  task.bindings
                    .filter((item) => result.missingModelElementIds.includes(item.id))
                    .map((item) => item.name)
                ),
              ],
            },
          ],
          modelDeclarations(context.index)
        ),
        repair: `Implement the unchanged supplied requirement: ${task.requirement}. Preserve unrelated expressions; return the complete contract for validation.`,
      },
    ];
  });
  return {
    version: GENERATION_CONTROL_VERSION,
    planHash: plan.hash,
    tasks,
    diagnostics,
    semanticStatus: 'not-proven' as const,
  };
}
export type GenerationTaskAudit = ReturnType<typeof auditGenerationTasks>;
