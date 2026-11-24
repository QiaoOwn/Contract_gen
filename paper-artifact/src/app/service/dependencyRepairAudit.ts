import {ccHash} from './crossClauseGraph';
import {permissionAst, samePath, astStructureHash, type PermissionAst} from './dependencyRepairAst';
import {
  assertRepairPermission,
  type PermissionInput,
  type RepairPermission,
} from './dependencyRepairPermissions';
import {auditCollaborative25} from './crossClauseCollaborative25';
import type {RepairCandidate} from './repairLocalization';
import type {TaskEvidence} from './constraintTaskPlan';
import type {ContractClause} from './modelRuleDiagnostics';
import {sameOclTokens} from './oclTokenIdentity';

export function auditDependencyRepair(
  permission: RepairPermission,
  input: PermissionInput,
  after: RepairCandidate,
  taskEvidence?: TaskEvidence[]
) {
  assertRepairPermission(permission, input);
  const next = permissionAst(after, input.context);
  const unauthorized: {clause: ContractClause; path: number[]; reason: string}[] = [];
  const changes: {
    clause: ContractClause;
    path: number[];
    before: string | null;
    after: string | null;
    authorized: boolean;
  }[] = [];
  const protectedViolations: {clause: ContractClause; path: number[]; reason: string}[] = [];
  const compare = (
    old: PermissionAst | undefined,
    current: PermissionAst | undefined,
    clause: ContractClause,
    path: number[]
  ) => {
    const region = permission.mayEdit.find(
      (item) => item.clause === clause && samePath(item.path, path)
    );
    const changed = astStructureHash(old) !== astStructureHash(current);
    if (region) {
      const allowed =
        !region.exactReplacementText ||
        current?.text === region.exactReplacementText ||
        current?.text === old?.text;
      if (changed)
        changes.push({
          clause,
          path,
          before: old?.text ?? null,
          after: current?.text ?? null,
          authorized: allowed,
        });
      if (!allowed)
        unauthorized.push({
          clause,
          path,
          reason: 'Replacement violates the program-verified rename alternatives',
        });
      return;
    }
    if (!changed) return;
    if (
      !old ||
      !current ||
      old.kind !== current.kind ||
      old.children.length !== current.children.length ||
      !old.children.length
    ) {
      unauthorized.push({
        clause,
        path,
        reason: 'Changed AST structure outside the selected permission holes',
      });
      changes.push({
        clause,
        path,
        before: old?.text ?? null,
        after: current?.text ?? null,
        authorized: false,
      });
      return;
    }
    old.children.forEach((child, i) => compare(child, current.children[i], clause, [...path, i]));
  };
  for (const clause of ['definition', 'precondition', 'postcondition'] as const) {
    if (permission.mode === 'evidence-only') {
      if (input.candidate[clause] !== after[clause])
        unauthorized.push({
          clause,
          path: [],
          reason: 'Evidence-only mode requires byte-identical D/P/Q',
        });
    } else if (permission.mode === 'syntax-clause-fallback') {
      const changed = !sameOclTokens(input.candidate[clause],after[clause]);
      if (!permission.coarseClauses.includes(clause) && changed)
        unauthorized.push({
          clause,
          path: [],
          reason: 'Fallback authorizes only parser-localized clauses',
        });
      if (changed)
        changes.push({
          clause,
          path: [],
          before: input.candidate[clause],
          after: after[clause],
          authorized: permission.coarseClauses.includes(clause),
        });
    } else compare(permission.beforeAst[clause], next.roots[clause], clause, []);
  }
  if (permission.mode === 'ast-scoped' || permission.mode === 'unresolved')
    for (const region of permission.protected) {
      let node = next.roots[region.clause];
      for (const index of region.path) node = node?.children[index];
      if (astStructureHash(node) !== region.beforeHash)
        protectedViolations.push({
          clause: region.clause,
          path: region.path,
          reason: 'Protected structure changed, disappeared or moved to a different scope/order',
        });
    }
  const crossClause = auditCollaborative25(
    {
      plan: input.plan,
      context: input.context,
      candidate: after,
      previous: input.candidate,
      taskEvidence,
    },
    input.pack
  );
  for (const region of permission.mayEdit.filter((item) => item.bindingTargetName)) {
    let node = next.roots[region.clause];
    for (const index of region.path) node = node?.children[index];
    if (!node?.location || node.text !== region.exactReplacementText) continue;
    const target = crossClause.graph.sharedBindings.find((binding) =>
      crossClause.graph.nodes.some(
        (item) => item.id === binding.bindingId && item.label === region.bindingTargetName
      )
    );
    if (
      !target?.uses.some(
        (use) =>
          use.clause === node!.clause &&
          use.startOffset === node!.location!.startOffset &&
          use.endOffset === node!.location!.endOffset
      )
    )
      unauthorized.push({
        clause: region.clause,
        path: region.path,
        reason: 'Rename substitution resolves to a different binding identity or is unbound',
      });
  }
  return {
    version: 'dependency-repair-audit-v1',
    permissionHash: permission.hash,
    beforeCandidateHash: permission.candidateHash,
    afterCandidateHash: ccHash(after),
    parsed: next.parsed,
    changes,
    unauthorized,
    protectedViolations,
    blocked:
      !next.parsed ||
      unauthorized.length > 0 ||
      protectedViolations.length > 0 ||
      crossClause.blocked,
    permissionPassed: next.parsed && !unauthorized.length && !protectedViolations.length,
    crossClause,
    scope:
      'structural edit authorization and supported deterministic constraints, not NL equivalence',
  };
}
