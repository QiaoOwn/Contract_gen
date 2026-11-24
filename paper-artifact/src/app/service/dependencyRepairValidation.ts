import {parse} from '../util';
import {permissionAst} from './dependencyRepairAst';
import {createEntryCode} from './createEntryCode';
import {parseTypescriptEntry} from './parseTypescriptEntry';
import {validateGeneratedContractSemantics} from './validateGeneratedContractSemantics';
import {validateModelGroundedContract} from './validateModelGroundedContract';
import {
  auditTaskEvidence,
  taskSolutionDiagnostics,
  type ConstraintTaskPlan,
  type TaskEvidence,
} from './constraintTaskPlan';
import {unifyStaticDiagnostics} from './repairDiagnostics';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';

// Existing OCLTSVM components, no Oracle read or hidden execution in this stage.
export async function validateDependencyRepairPreExec(
  candidate: RepairCandidate,
  evidence: TaskEvidence[],
  plan: ConstraintTaskPlan,
  context: OperationModelGrounding
) {
  const contract = permissionAst(candidate, context).contract;
  const parsed = parse(contract);
  if (!parsed.tree || parsed.errors.length)
    return {
      preexecValid: false,
      diagnostics: unifyStaticDiagnostics('parser', parsed.errors),
      terminalEvidence: null,
      stage: 'parser',
    };
  const tasks = taskSolutionDiagnostics(
    plan,
    auditTaskEvidence(plan, candidate, evidence, context).issues
  );
  const subset = validateGeneratedContractSemantics({
    tree: parsed.tree,
    hasReturnValue: Boolean(context.index.operation.returnType),
  });
  const model = validateModelGroundedContract({tree: parsed.tree, context});
  const diagnostics = [
    ...tasks,
    ...unifyStaticDiagnostics('parser', subset),
    ...unifyStaticDiagnostics('model', model.diagnostics),
  ];
  if (diagnostics.length)
    return {preexecValid: false, diagnostics, terminalEvidence: null, stage: 'contract'};
  try {
    const code = await createEntryCode({
      project: context.index.project as Parameters<typeof createEntryCode>[0]['project'],
      useCase: context.index.useCase as never,
      operation: context.index.operation.name,
      ocl: candidate,
    });
    const errors = parseTypescriptEntry(code.entry);
    return {
      preexecValid: errors.length === 0,
      diagnostics: unifyStaticDiagnostics('typescript', errors),
      terminalEvidence: null,
      stage: 'typescript',
      generatedTypeScript: code.entry,
    };
  } catch (error) {
    return {
      preexecValid: false,
      diagnostics: unifyStaticDiagnostics('lowering', [{msg: String(error)}]),
      terminalEvidence: null,
      stage: 'lowering',
    };
  }
}
