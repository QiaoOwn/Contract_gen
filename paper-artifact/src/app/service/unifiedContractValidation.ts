import {parse} from '../util';
import {permissionAst} from './dependencyRepairAst';
import {validateGeneratedContractSemantics} from './validateGeneratedContractSemantics';
import {validateModelGroundedContract} from './validateModelGroundedContract';
import {createEntryCode} from './createEntryCode';
import {parseTypescriptEntry} from './parseTypescriptEntry';
import {auditCrossClauseContract} from './crossClauseConstraintAudit';
import {unifyStaticDiagnostics, type RepairDiagnostic} from './repairDiagnostics';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {ConstraintTaskPlan} from './constraintTaskPlan';
import type {UnifiedContractCandidate} from './narrativeTransport';
import type {RepairCandidate} from './repairLocalization';
import {assessDevelopmentCandidate} from './developmentBehavior/assessDevelopmentCandidate';

export async function validateUnifiedContract(candidate: UnifiedContractCandidate, context: OperationModelGrounding, plan: ConstraintTaskPlan,
 options?: {development?: {enabled: boolean; requirement: string}}) {
  const contract: RepairCandidate = {...candidate.contract, definition: candidate.contract.definition ?? ''};
  const assembled = permissionAst(contract, context).contract;
  const parsed = parse(assembled);
  const diagnostics: RepairDiagnostic[] = [];
  const stages: {stage: string; status: 'PASS' | 'FAIL' | 'NOT_EVALUATED'; evidence: unknown}[] = [];
  const syntaxValid = Boolean(parsed.tree && !parsed.errors.length);
  stages.push({stage: 'parser', status: syntaxValid ? 'PASS' : 'FAIL', evidence: parsed.errors});
  if (!syntaxValid) diagnostics.push(...unifyStaticDiagnostics('parser', parsed.errors));
  const subset = syntaxValid ? validateGeneratedContractSemantics({tree: parsed.tree!, hasReturnValue: Boolean(context.index.operation.returnType)}) : null;
  const model = syntaxValid ? validateModelGroundedContract({tree: parsed.tree!, context}) : null;
  stages.push({stage: 'dialect', status: subset ? subset.length ? 'FAIL' : 'PASS' : 'NOT_EVALUATED', evidence: subset});
  stages.push({stage: 'model-type', status: model ? model.diagnostics.length ? 'FAIL' : 'PASS' : 'NOT_EVALUATED', evidence: model?.diagnostics ?? null});
  if (subset?.length) diagnostics.push(...unifyStaticDiagnostics('parser', subset));
  if (model?.diagnostics.length) diagnostics.push(...unifyStaticDiagnostics('model', model.diagnostics));
  const cross = auditCrossClauseContract({enabled: true, plan, context, candidate: contract});
  let preExecValid = false, lowering: unknown = null;
  let typescript: Awaited<ReturnType<typeof createEntryCode>> | null = null;
  if (syntaxValid && subset?.length === 0 && model?.diagnostics.length === 0) {
    try {
      typescript = await createEntryCode({project: context.index.project, useCase: context.index.useCase,
        operation: context.index.operation.name, ocl: contract} as never);
      const errors = parseTypescriptEntry(typescript.entry);
      lowering = errors; preExecValid = errors.length === 0;
      diagnostics.push(...unifyStaticDiagnostics('typescript', errors));
      stages.push({stage: 'lowering', status: 'PASS', evidence: null},
        {stage: 'typescript', status: preExecValid ? 'PASS' : 'FAIL', evidence: errors});
    } catch (error) {
      lowering = String(error);
      diagnostics.push(...unifyStaticDiagnostics('lowering', [{msg: String(error)}]));
      stages.push({stage: 'lowering', status: 'FAIL', evidence: String(error)});
    }
  }
  const result = {publicContractValid: true, internalProtocolValid: true, contract: assembled, syntaxValid,
    subsetValid: subset?.length === 0, modelTypeValid: model?.diagnostics.length === 0, preExecValid,
    lowering, typescript, stages, diagnostics,
    deterministicConflicts: cross.diagnostics.filter(item => item.status === 'conflict'),
    unresolved: cross.diagnostics.filter(item => item.status === 'unresolved'), behavior: 'not-evaluated' as const};
  if(!options?.development?.enabled)return result;
  const development=await assessDevelopmentCandidate({enabled:true,preExecValid,entry:typescript?.entry,
    requirement:options.development.requirement,candidate:contract,context});
  return {...result,development,developmentAcceptance:preExecValid&&development.status==='PASS'};
}
