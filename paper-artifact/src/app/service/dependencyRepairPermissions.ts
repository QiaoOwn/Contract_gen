import {parse} from '../util';
import {auditCollaborative25} from './crossClauseCollaborative25';
import {assertPackage25, type Package25} from './crossClausePackage25';
import {extractDependencies25, type Graph25} from './crossClauseDependencies25';
import {ccHash} from './crossClauseGraph';
import {
  auditTaskEvidence,
  taskSolutionDiagnostics,
  type ConstraintTaskPlan,
  type TaskEvidence,
} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairCandidate} from './repairLocalization';
import type {RepairDiagnostic} from './repairDiagnostics';
import {unifyStaticDiagnostics} from './repairDiagnostics';
import {constraintRepairContext} from './constraintRepair';
import {
  permissionAst,
  smallestSite,
  pathContains,
  astStructureHash,
  REPAIR_CLAUSES,
  type PermissionAst,
} from './dependencyRepairAst';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import {oclSyntaxIdentity} from './validateModelGroundedContract';

export type RepairRegion = {
  id: string;
  clause: ContractClause;
  path: number[];
  location?: OclLocation;
  kind: string;
  beforeHash: string;
  diagnosticIds: string[];
  constraintIds: string[];
  reason: string;
  exactReplacementText?: string;
  bindingTargetName?: string;
};
export type PermissionOption = {
  id: string;
  reason: string;
  mayEdit: RepairRegion[];
  rootCauseEstablished: boolean;
};
export type RepairPermission = {
  version: 'dependency-repair-permission-v1';
  candidateHash: string;
  planHash: string;
  packageHash: string;
  mode: 'evidence-only' | 'ast-scoped' | 'syntax-clause-fallback' | 'unresolved';
  diagnosticIds: string[];
  constraintIds: string[];
  diagnostics: RepairDiagnostic[];
  affectedBindings: Graph25['sharedBindings'];
  mustRevalidate: {id: string; clause?: ContractClause; location?: OclLocation}[];
  mayEdit: RepairRegion[];
  protected: RepairRegion[];
  alternatives: PermissionOption[];
  selectedOption: string;
  sourceEvidence: {taskId: string; line: number; requirement: string}[];
  modelDeclarations: ConstraintTaskPlan['declarations'];
  repairReason: string;
  unresolvedRelations: unknown[];
  graphHash: string;
  beforeAst: ReturnType<typeof permissionAst>['roots'];
  coarseClauses: ContractClause[];
  hash: string;
};
export type PermissionInput = {
  plan: ConstraintTaskPlan;
  context: OperationModelGrounding;
  pack: Package25;
  candidate: RepairCandidate;
  previous?: RepairCandidate;
  taskEvidence?: TaskEvidence[];
  optionId?: string;
  validatorDiagnostics?: RepairDiagnostic[];
};
const diagId = (item: RepairDiagnostic) =>
  ccHash({code: item.code, msg: item.msg, location: item.location});
const overlap = (a: OclLocation, b: OclLocation) =>
  a.clause === b.clause && a.startOffset < b.endOffset && b.startOffset < a.endOffset;

function groundedRename(input: PermissionInput, ast: ReturnType<typeof permissionAst>) {
  if (!input.previous || !ast.parsed) return null;
  const old = permissionAst(input.previous, input.context);
  if (!old.parsed) return null;
  const previous =
    parse(old.contract).tree!.ruleDefinition()?.ruleVariableDeclarationCS_list() ?? [];
  const current =
    parse(ast.contract).tree!.ruleDefinition()?.ruleVariableDeclarationCS_list() ?? [];
  const pairs = previous.flatMap((a) =>
    current
      .filter(
        (b) =>
          a.ruleSimpleNameCS().getText() !== b.ruleSimpleNameCS().getText() &&
          a.ruleTypeCS()?.getText() === b.ruleTypeCS()?.getText() &&
          a.ruleOCLExpressionCS() &&
          b.ruleOCLExpressionCS() &&
          oclSyntaxIdentity(a.ruleOCLExpressionCS()) === oclSyntaxIdentity(b.ruleOCLExpressionCS())
      )
      .map((b) => ({
        oldName: a.ruleSimpleNameCS().getText(),
        newName: b.ruleSimpleNameCS().getText(),
        oldOffset: a.start.start,
        newOffset: b.start.start,
      }))
  );
  if (pairs.length !== 1) return null;
  const pair = pairs[0];
  if (
    input.context.index.operation.parameters.some((item) => item.name === pair.newName) ||
    input.context.index.environment.some((item) => item.name === pair.newName)
  )
    return null;
  if (
    current.some((node) => node.ruleSimpleNameCS().getText() === pair.oldName) ||
    previous.filter((node) => node.ruleSimpleNameCS().getText() === pair.oldName).length !== 1 ||
    current.filter((node) => node.ruleSimpleNameCS().getText() === pair.newName).length !== 1
  )
    return null;
  const graph = extractDependencies25({
    pack: input.pack.base,
    plan: input.plan,
    context: input.context,
    candidate: input.previous,
  }).graph;
  const binding = graph.sharedBindings.find(
    (item) => item.declaration.startOffset === pair.oldOffset
  );
  if (!binding) return null;
  return {
    ...pair,
    uses: binding.uses.filter(
      (use) =>
        use.clause !== 'definition' && input.previous![use.clause] === input.candidate[use.clause]
    ),
    previousCandidateHash: ccHash(input.previous),
    basis: 'unique typed initializer-identical declaration rename with unchanged consumer clauses',
  };
}

export function planDependencyRepair(input: PermissionInput): RepairPermission {
  assertPackage25(input.pack, input.plan, input.context);
  if (
    input.validatorDiagnostics?.some(
      (item) =>
        !['parser', 'model', 'lowering', 'typescript'].includes(item.stage) ||
        ['behavior', 'execution'].includes(item.category)
    )
  )
    throw new Error('Behavior/hidden evaluation is not a repair input');
  const audit = auditCollaborative25(input, input.pack);
  const ast = permissionAst(input.candidate, input.context);
  const taskIssues = input.taskEvidence
    ? auditTaskEvidence(input.plan, input.candidate, input.taskEvidence, input.context).issues
    : [];
  const diagnostics = [
    ...audit.diagnostics,
    ...taskSolutionDiagnostics(input.plan, taskIssues),
    ...(!ast.parsed ? unifyStaticDiagnostics('parser', ast.errors) : []),
    ...(input.validatorDiagnostics ?? []),
  ].filter((item, i, all) => all.findIndex((other) => diagId(item) === diagId(other)) === i);
  const ids = diagnostics.map(diagId),
    constraintIds = [
      ...new Set(
        diagnostics.flatMap((item) => (item.ruleIds.length ? item.ruleIds : ['ocl-parser']))
      ),
    ];
  const makeRegion = (
    node: PermissionAst,
    reasons: RepairDiagnostic[],
    reason: string,
    replacement?: string
  ): RepairRegion => ({
    id: ccHash({clause: node.clause, path: node.path}),
    clause: node.clause,
    path: node.path,
    location: node.location,
    kind: node.kind,
    beforeHash: astStructureHash(node),
    diagnosticIds: reasons.map(diagId),
    constraintIds: [
      ...new Set(reasons.flatMap((item) => (item.ruleIds.length ? item.ruleIds : ['ocl-parser']))),
    ],
    reason,
    ...(replacement ? {exactReplacementText: replacement} : {}),
  });
  const structural = diagnostics.filter((item) => !item.code.startsWith('TASK_'));
  const evidenceOnly = ast.parsed && taskIssues.length > 0 && !structural.length;
  const local: RepairRegion[] = [];
  if (ast.parsed && !evidenceOnly)
    for (const diagnostic of diagnostics) {
      const site = diagnostic.location;
      if (site.resolution !== 'ocl-expression' || !diagnostic.repairEligible) continue;
      if (!site.clause || site.line === undefined || site.column === undefined) continue;
      const hit = ast.nodes
        .filter(
          (node) =>
            node.clause === site.clause &&
            node.location &&
            node.location.line <= site.line! &&
            node.location.endLine >= site.line! &&
            (node.location.line !== site.line || node.location.column <= site.column! + 1) &&
            (node.location.endLine !== site.line || node.location.endColumn > site.column! + 1)
        )
        .sort(
          (a, b) =>
            a.location!.endOffset -
            a.location!.startOffset -
            (b.location!.endOffset - b.location!.startOffset)
        );
      const exact = hit.find((node) =>
        ['RuleAtomicExpressionContext', 'RuleVariableDeclarationCSContext'].includes(node.kind)
      );
      if (exact)
        local.push(
          makeRegion(
            exact,
            [diagnostic],
            'Localized validator conflict; permission does not imply this site is the unique root cause'
          )
        );
    }
  const normalize = (regions: RepairRegion[]) =>
    regions.filter(
      (item, i) =>
        !regions.some(
          (other, j) =>
            j !== i &&
            item.clause === other.clause &&
            pathContains(other.path, item.path) &&
            (other.path.length < item.path.length || j < i)
        )
    );
  const alternatives: PermissionOption[] = [];
  if (local.length)
    alternatives.push({
      id: 'diagnosed-consumers',
      reason:
        'Edit only independently diagnosed syntax regions; dependency alone grants no permission',
      mayEdit: normalize(local),
      rootCauseEstablished: false,
    });

  // Reverse traversal starts from actual consumer locations, never variable-name guesses.
  const involved = audit.graph.sharedBindings.filter((binding) =>
    local.some(
      (region) => region.location && binding.uses.some((use) => overlap(use, region.location!))
    )
  );
  for (const binding of involved) {
    const declaration = ast.nodes.find(
      (node) =>
        node.kind === 'RuleVariableDeclarationCSContext' &&
        node.location?.startOffset === binding.declaration.startOffset
    );
    if (
      declaration &&
      structural.some(
        (item) => item.code.includes('CC-TYPE') && item.location.clause !== 'definition'
      )
    )
      alternatives.push({
        id: `definition-source:${binding.bindingId}`,
        reason:
          'Consumer type conflict traces to this real D binding; either endpoint may be wrong. This is one explicit alternative, not a proven unique cause.',
        mayEdit: [
          makeRegion(
            declaration,
            structural.filter((item) => item.code.includes('CC-TYPE')),
            'Reverse consumer-to-definition type dependency with authoritative declared return/feature type'
          ),
        ],
        rootCauseEstablished: false,
      });
  }
  const rename = groundedRename(input, ast);
  if (rename) {
    const unbound = diagnostics.filter((item) => item.code.includes('CC-SCOPE'));
    // Require real unbound-variable findings at the unchanged old consumer sites.
    const findings = audit.baseAcceptance.audit.diagnostics.filter(
      (item) =>
        item.underlyingCode === 'UNBOUND_VARIABLE' &&
        item.location &&
        rename.uses.some(
          (use) => use.clause === item.clause && use.expression === item.location!.expression
        )
    );
    if (findings.length) {
      const consumers = findings.flatMap((finding) => {
        const node = smallestSite(ast, finding.location!, ['RuleVariableExpCSContext']);
        return node
          ? [
              {
                ...makeRegion(
                  node,
                  diagnostics.filter((item) => item.location.clause === finding.clause),
                  `${rename.basis}; preserve D and substitute only the proven renamed lexical symbol`,
                  rename.newName
                ),
                bindingTargetName: rename.newName,
              },
            ]
          : [];
      });
      if (consumers.length)
        alternatives.push({
          id: 'align-renamed-consumers',
          reason: rename.basis,
          mayEdit: normalize(consumers),
          rootCauseEstablished: false,
        });
      const declaration = ast.nodes.find(
        (node) =>
          node.kind === 'RuleVariableDeclarationCSContext' &&
          node.location?.startOffset === rename.newOffset
      );
      const name =
        declaration &&
        ast.nodes.find(
          (node) =>
            node.clause === 'definition' &&
            node.kind === 'RuleSimpleNameCSContext' &&
            node.path.length === declaration.path.length + 1 &&
            pathContains(declaration.path, node.path)
        );
      if (name)
        alternatives.push({
          id: 'restore-definition-name',
          reason: 'Alternative structural alpha-rename repair; do not change initializer or type',
          mayEdit: [
            makeRegion(name, unbound.length ? unbound : structural, rename.basis, rename.oldName),
          ],
          rootCauseEstablished: false,
        });
    }
  }
  const coarseClauses: ContractClause[] = [];
  if (!ast.parsed) {
    const repair = constraintRepairContext(input.candidate, diagnostics, input.context);
    for (const diagnostic of repair.diagnostics)
      if (
        diagnostic.stage === 'parser' &&
        diagnostic.location.clause &&
        repair.parserContext.some(
          (item) =>
            item.sourceLocationValidated &&
            item.line === diagnostic.location.line &&
            item.column === diagnostic.location.column
        )
      )
        coarseClauses.push(diagnostic.location.clause);
    if (coarseClauses.length)
      alternatives.push({
        id: 'syntax-clause-fallback',
        reason: 'Parser-validated clause coordinates; no reliable AST dependency precision',
        mayEdit: [],
        rootCauseEstablished: false,
      });
  }
  const selected = input.optionId
    ? alternatives.find((option) => option.id === input.optionId)
    : alternatives[0];
  if (input.optionId && !selected)
    throw new Error('Requested permission alternative is not justified by this candidate');
  const mayEdit = evidenceOnly ? [] : (selected?.mayEdit ?? []);
  const protectedRegions: RepairRegion[] = [];
  const protect = (node: PermissionAst) => {
    if (
      mayEdit.some(
        (region) => region.clause === node.clause && pathContains(region.path, node.path)
      )
    )
      return;
    if (
      mayEdit.some(
        (region) => region.clause === node.clause && pathContains(node.path, region.path)
      )
    ) {
      node.children.forEach(protect);
      return;
    }
    protectedRegions.push(makeRegion(node, [], 'Outside selected diagnostic authorization'));
  };
  Object.values(ast.roots).forEach((node) => {
    if (node) protect(node);
  });
  const affectedBindings = audit.graph.sharedBindings.filter(
    (binding) =>
      involved.includes(binding) ||
      mayEdit.some(
        (region) =>
          region.location &&
          (overlap(region.location, binding.declaration) ||
            binding.uses.some((use) => overlap(use, region.location!)))
      )
  );
  const roots = new Set(affectedBindings.map((binding) => binding.bindingId));
  for (const node of audit.graph.nodes)
    if (
      node.location &&
      mayEdit.some((region) => region.location && overlap(node.location!, region.location))
    )
      roots.add(node.id);
  const queue = [...roots];
  const adjacency = new Map<string, string[]>();
  for (const edge of audit.graph.edges)
    if (
      edge.strength === 'grounded' &&
      edge.verification === 'checked' &&
      ['valueDependsOn', 'typeDependsOn', 'stateDependsOn'].includes(edge.kind)
    )
      adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  for (let i = 0; i < queue.length; i++)
    for (const id of adjacency.get(queue[i]) ?? [])
      if (!roots.has(id)) {
        roots.add(id);
        queue.push(id);
      }
  const payload: Omit<RepairPermission, 'hash'> = {
    version: 'dependency-repair-permission-v1',
    candidateHash: ccHash(input.candidate),
    planHash: input.plan.hash,
    packageHash: input.pack.hash,
    mode: evidenceOnly
      ? 'evidence-only'
      : !ast.parsed && coarseClauses.length
        ? 'syntax-clause-fallback'
        : mayEdit.length
          ? 'ast-scoped'
          : 'unresolved',
    diagnosticIds: ids,
    constraintIds,
    diagnostics,
    affectedBindings,
    mustRevalidate: [
      ...audit.graph.nodes
        .filter((node) => roots.has(node.id))
        .map((node) => ({id: node.id, clause: node.clause, location: node.location})),
      ...(audit.impact?.mustRevalidate ?? []),
    ],
    mayEdit,
    protected: protectedRegions,
    alternatives,
    selectedOption: selected?.id ?? 'none',
    sourceEvidence: input.plan.tasks.map((task) => ({
      taskId: task.id,
      line: task.requirementLine,
      requirement: task.requirement,
    })),
    modelDeclarations: input.plan.declarations,
    repairReason:
      selected?.reason ??
      (evidenceOnly
        ? 'Invalid structural task evidence only'
        : 'No determinate repair authorization'),
    unresolvedRelations: [
      ...audit.graph.edges.filter((edge) => edge.kind === 'proposedSemanticRelation'),
      ...(rename ? [rename] : []),
    ],
    graphHash: audit.graph.hash,
    beforeAst: ast.roots,
    coarseClauses: [...new Set(coarseClauses)],
  };
  return {...payload, hash: ccHash(payload)};
}

export function assertRepairPermission(permission: RepairPermission, input: PermissionInput) {
  const expected = planDependencyRepair({
    ...input,
    optionId: permission.selectedOption === 'none' ? undefined : permission.selectedOption,
  });
  if (ccHash(expected) !== ccHash(permission))
    throw new Error('Repair permission differs from program-owned diagnostic evidence');
}
