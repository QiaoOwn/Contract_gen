import {stage5PublicSchema} from './contractgenStage5';
import {permissionAst} from '../../src/app/service/dependencyRepairAst';
import {parse} from '../../src/app/util';
import {validateGeneratedContractSemantics} from '../../src/app/service/validateGeneratedContractSemantics';
import {validateModelGroundedContract} from '../../src/app/service/validateModelGroundedContract';
import type {OperationModelGrounding} from '../../src/app/service/operationModelGrounding';

export function structuralEvidence6(response: unknown, context: OperationModelGrounding) {
  const protocol = stage5PublicSchema.safeParse(response);
  if (!protocol.success) return {stage: 'protocol', diagnostics: protocol.error.issues};
  const contract = {...protocol.data.contract, definition: protocol.data.contract.definition ?? ''};
  const parsed = parse(permissionAst(contract, context).contract);
  if (!parsed.tree || parsed.errors.length) return {stage: 'syntax', diagnostics: parsed.errors};
  return {stage: 'typed-AST', subsetDiagnostics: validateGeneratedContractSemantics({tree: parsed.tree,
    hasReturnValue: !!context.index.operation.returnType}),
    modelDiagnostics: validateModelGroundedContract({tree: parsed.tree, context}).diagnostics,
    meaning: 'Original checker diagnostics with source/AST locations, not business-semantic verdicts.'};
}
